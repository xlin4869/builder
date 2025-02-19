import 'server-only'

import { and, desc, eq, sql } from 'drizzle-orm'

import { auth, currentUserEmail } from '@/lib/auth'
import { db } from '@/lib/drizzle-edge'
import { logsnag } from '@/lib/logsnag'
import { nanoid } from '@/lib/utils'

import { AppsTable } from '../apps/schema'
import { SessionsTable } from '../sessions/schema'
import { WorkspaceTable } from './schema'

export async function addToWorkspace(appId: string) {
  const requestId = nanoid()
  const { userId } = auth()
  if (!userId) return Promise.resolve(null)

  const foundAppAtWorkspace = await db
    .select()
    .from(WorkspaceTable)
    .where(
      and(
        eq(WorkspaceTable.user_id, userId),
        eq(WorkspaceTable.app_id, appId),
        eq(WorkspaceTable.archived, false)
      )
    )
    .limit(1)

  if (foundAppAtWorkspace.length > 0) {
    return Promise.resolve({ appId, foundApp: true })
  }

  const email = await currentUserEmail()

  const [foundApp] = await db
    .select({ name: AppsTable.name })
    .from(AppsTable)
    .where(eq(AppsTable.short_id, appId))
    .limit(1)

  await logsnag?.track({
    user_id: userId,
    channel: 'user',
    event: 'Add App to Workspace Request',
    icon: '➡️',
    description: `${email} request to add app ${foundApp.name} to workspace`,
    tags: {
      'request-id': requestId,
      'user-id': userId,
      'app-id': appId,
    },
  })

  const val = { short_id: nanoid(), app_id: appId, user_id: userId }
  const [newWorkspace] = await db.insert(WorkspaceTable).values(val).returning()

  await logsnag?.track({
    user_id: userId,
    channel: 'user',
    event: 'Add App to Workspace Request',
    icon: '✅',
    description: `${email} added app ${foundApp.name} to workspace successfully`,
    tags: {
      'request-id': requestId,
      'user-id': userId,
      'app-id': appId,
      'workspace-id': newWorkspace.short_id,
    },
  })

  return Promise.resolve({ appId })
}

export async function getWorkspace() {
  const { userId } = auth()
  if (!userId) return []

  const result = await db
    .selectDistinctOn([AppsTable.short_id], {
      app_id: AppsTable.short_id,
      app_name: AppsTable.name,
      app_icon: AppsTable.icon,
      session_id: SessionsTable.short_id,
      created_at: WorkspaceTable.created_at,
    })
    .from(WorkspaceTable)
    .orderBy(desc(WorkspaceTable.created_at))
    .where(
      and(
        eq(WorkspaceTable.user_id, userId),
        eq(WorkspaceTable.archived, false)
      )
    )
    .rightJoin(
      AppsTable,
      and(
        eq(WorkspaceTable.app_id, AppsTable.short_id),
        eq(AppsTable.archived, false)
      )
    )
    .leftJoin(
      SessionsTable,
      and(
        eq(AppsTable.short_id, SessionsTable.app_id),
        eq(SessionsTable.created_by, userId),
        eq(SessionsTable.archived, false)
      )
    )
    .orderBy(
      AppsTable.short_id,
      desc(SessionsTable.created_at),
      desc(WorkspaceTable.created_at)
    )

  const sorted = result.sort(
    (a, b) => (b.created_at?.getTime() || 0) - (a.created_at?.getTime() || 0)
  )

  return sorted

  // // raw sql
  // const result = await db.execute(sql`
  //   SELECT DISTINCT ON (apps.short_id)
  //     apps.short_id AS app_id,
  //     apps.name AS app_name,
  //     apps.icon AS app_icon,
  //     sessions.short_id AS session_id
  //   FROM
  //     workspace
  //   LEFT JOIN
  //     apps ON workspace.app_id = apps.short_id
  //   LEFT JOIN
  //     sessions ON apps.short_id = sessions.app_id
  //   ORDER BY
  //     apps.short_id,
  //     sessions.created_at DESC,
  //     workspace.created_at DESC;
  //   `)
  // return (result.rows || []) as unknown as WorkspaceItem[]
}

export async function removeFromWorkspace(appId: string) {
  const requestId = nanoid()
  const { userId } = auth()
  if (!userId) return Promise.resolve(null)

  const email = await currentUserEmail()

  const [foundApp] = await db
    .select({ name: AppsTable.name })
    .from(AppsTable)
    .where(eq(AppsTable.short_id, appId))
    .limit(1)

  await logsnag?.track({
    user_id: userId,
    channel: 'creator',
    event: 'Remove App from Workspace Request',
    icon: '➡️',
    description: `${email} request to remove app ${foundApp.name} from workspace`,
    tags: {
      'request-id': requestId,
      'user-id': userId,
      'app-id': appId,
    },
  })

  const [removedWorkspace] = await db
    .update(WorkspaceTable)
    .set({ archived: true, updated_at: new Date() })
    .where(
      and(eq(WorkspaceTable.app_id, appId), eq(WorkspaceTable.user_id, userId))
    )
    .returning()

  await logsnag?.track({
    user_id: userId,
    channel: 'creator',
    event: 'Remove App from Workspace Request',
    icon: '✅',
    description: `${email} removed app ${foundApp.name} from workspace successfully`,
    tags: {
      'request-id': requestId,
      'user-id': userId,
      'app-id': appId,
      'workspace-id': removedWorkspace.short_id,
    },
  })

  return removedWorkspace
}
