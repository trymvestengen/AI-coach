export type Message = {
  role: "user" | "assistant"
  content: string
}

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"
  return (
    <div
      className="forge"
      style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}
    >
      <div className={`bubble ${isUser ? "user" : "coach"}`}>{message.content}</div>
    </div>
  )
}
