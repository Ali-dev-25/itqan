"""
Itqan - Application Global State
Manages user session, navigation history, and event subscriptions.
"""

class AppState:
    def __init__(self):
        self.user = {"name": "أحمد محمد", "role": "مدير النظام", "initials": "AM"}
        self.current_page = "dashboard"
        self.previous_page = None
        self.notification_count = 3
        self._listeners = {}

    def navigate_to(self, page_id: str):
        self.previous_page = self.current_page
        self.current_page = page_id
        self._emit("page_changed", page_id)

    def on(self, event: str, callback):
        if event not in self._listeners:
            self._listeners[event] = []
        self._listeners[event].append(callback)

    def _emit(self, event: str, data=None):
        for cb in self._listeners.get(event, []):
            try:
                cb(data)
            except Exception as e:
                print(f"[AppState Event Error] {event}: {e}")
