import React from "react";
import { useAuthStore } from "../stores/useAuthStore";

function ChatPage() {
  const { logout } = useAuthStore();
  return (
    <div className="z-10">
      <button className="btn" onClick={logout}>
        Logout
      </button>
    </div>
  );
}

export default ChatPage;
