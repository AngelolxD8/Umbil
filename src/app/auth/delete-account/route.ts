// src/app/api/auth/delete-account/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseService";
import { supabase } from "@/lib/supabase";

export async function DELETE(req: NextRequest) {
  // 1. Verify the user via the standard client (gets user from the cookie/token)
  const token = req.headers.get("authorization")?.split("Bearer ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  try {
    const userId = user.id;

    // 2. Use the Service Role client to delete the user from auth.users.
    // IMPORTANT: Your PostgreSQL database should have "ON DELETE CASCADE" set up 
    // for the foreign keys in 'cpd_entries' and 'profiles'. 
    // If not, this will fail or leave orphaned data.
    
    const { error: deleteError } = await supabaseService.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Delete user error:", deleteError);
      throw new Error(deleteError.message);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete account exception:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}