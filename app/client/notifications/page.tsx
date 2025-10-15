import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getNotifications } from "@/lib/actions/notifications"
import { NotificationsList } from "@/components/notifications/notifications-list"

export default async function ClientNotificationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user is client
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "client") {
    redirect("/")
  }

  const notifications = await getNotifications()

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">الإشعارات</h1>
        <p className="text-muted-foreground">جميع الإشعارات والتحديثات</p>
      </div>

      <NotificationsList initialNotifications={notifications} userId={user.id} />
    </div>
  )
}
