// src/controllers/workspaceController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { Response } from "express";
import { prisma } from "../db";                                       // Core database shared client connection instance
import { AuthenticatedRequest } from "../middleware/authMiddleware"; // Protected session request layout
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: FETCH USER WORKSPACES (WITH LAZY-SEEDER FALLBACK) ===
   ========================================================================== */
export const getUserWorkspaces = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access. Valid session tracker missing." });
      return;
    }

    // 1. Check if the user has any workspaces logged in the database
    let workspaces = await prisma.workspace.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" }
    });

    // 2. LAZY SEEDER ENFORCER: If an older user logs in and holds 0 spaces, provision them right now!
    if (workspaces.length === 0) {
      await prisma.workspace.createMany({
        data: [
          { name: "Personal", currency: "USD", userId },
          { name: "Business", currency: "USD", userId }
        ]
      });

      // Re-query to capture the freshly minted cloud entries with their proper unique IDs
      workspaces = await prisma.workspace.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" }
      });
    }

    res.status(200).json({ workspaces });
  } catch (error) {
    console.error("Fetch Workspaces Controller Error:", error);
    res.status(500).json({ error: "Internal server error while fetching workspace environments." });
  }
};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CREATE CUSTOM WORKSPACE ===
   ========================================================================== */
export const createWorkspace = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { name, currency } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access. Session verification footprint missing." });
      return;
    }

    if (!name) {
      res.status(400).json({ error: "Workspace label name is a required field parameter." });
      return;
    }

    // ... inside your createWorkspace try-catch block ...
    const newWorkspace = await prisma.workspace.create({
      data: {
        name,
        currency: currency || "USD", // FIXED: Changed default string fallback to USD
        userId
      }
    });
    // ... rest of the controller stays exactly the same ..

    res.status(201).json({
      message: "Custom financial workspace generated successfully!",
      workspace: newWorkspace
    });
  } catch (error) {
    console.error("Create Workspace Controller Exception:", error);
    res.status(500).json({ error: "Internal server error during workspace instantiation process." });
  }
};
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: DELETE EXISTING WORKSPACE ===
   ========================================================================== */
export const deleteWorkspace = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    // FIXED: Using String() wrapper forces the incoming param value into a strict primitive string layout,
    // completely satisfying TypeScript and resolving the string[] assignment conflict.
    const targetId = req.params.id ? String(req.params.id) : undefined;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access. Valid identity properties missing." });
      return;
    }

    if (!targetId) {
      res.status(400).json({ error: "Workspace target identifier missing from request parameters." });
      return;
    }

    // Query the database safely using our guaranteed string primitive key variable
    const workspaceTarget = await prisma.workspace.findUnique({ where: { id: targetId } });

    if (!workspaceTarget) {
      res.status(404).json({ error: "The requested workspace ledger profile could not be found." });
      return;
    }

    if (workspaceTarget.userId !== userId) {
      res.status(403).json({ error: "Access denied. You do not hold ownership permissions for this profile." });
      return;
    }

    const totalWorkspaceCount = await prisma.workspace.count({ where: { userId } });
    if (totalWorkspaceCount <= 1) {
      res.status(400).json({ error: "Action blocked. Rakho Khata requires an active tracking profile workspace to function." });
      return;
    }

    await prisma.workspace.delete({ where: { id: targetId } });

    res.status(200).json({ message: "Workspace tracking profile and associated ledger logs removed safely." });
  } catch (error) {
    console.error("Delete Workspace Controller Exception:", error);
    res.status(500).json({ error: "Internal server error running workspace deletion script blocks." });
  }
};
/* === SECTION 4 END === */