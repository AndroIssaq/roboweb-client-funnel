import { getMessages } from "@/lib/actions/messages"
import { MessagesView } from "@/components/messages/messages-view"

export default async function AdminMessagesPage() {
  const messages = await getMessages()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">الرسائل</h1>
        <p className="text-muted-foreground">التواصل مع العملاء والشركاء</p>
      </div>

      <MessagesView messages={messages} />
    </div>
  )
}
