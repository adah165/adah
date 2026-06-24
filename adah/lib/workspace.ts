import { prisma } from "@/lib/prisma"

/**
 * Resolves the workspace ID for a given user email.
 * If the user does not exist, it creates the user.
 * If the user has no workspace, it creates a default workspace and hooks them as ADMIN.
 */
export async function getWorkspaceIdForUser(email: string): Promise<string | null> {
  if (!email) return null

  try {
    // 1. Find the user
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        workspaces: true,
      },
    })

    // 2. Create the user if they don't exist yet (first time login fallback)
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
        },
        include: {
          workspaces: true,
        },
      })
    }

    // 3. If user has a workspace, return the first one
    if (user.workspaces && user.workspaces.length > 0) {
      return user.workspaces[0].workspaceId
    }

    // 4. Create a default workspace for this user
    const workspaceName = user.name ? `مساحة عمل ${user.name}` : "مساحة عملي الرئيسية"
    const newWorkspace = await prisma.workspace.create({
      data: {
        name: workspaceName,
      },
    })

    // 5. Link user to the new workspace as ADMIN
    await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: newWorkspace.id,
        role: "ADMIN",
      },
    })

    return newWorkspace.id
  } catch (error) {
    console.error(`Error resolving workspace for email ${email}:`, error)
    return null
  }
}
