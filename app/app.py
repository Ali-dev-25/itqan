"""
Itqan - Flet Application Shell & Lifecycle Controller
Manages window configuration, RTL orientation, Cairo font registration,
Pre-flight verification splash screen, and the zero-flicker Stack AppShell layout.
"""

import time
import threading
import flet as ft
from theme.colors import COLORS
from theme.fonts import configure_flet_fonts
from app.state import AppState
from app.router import Router
from components.sidebar import Sidebar
from components.header import Header
from components.splash_screen import SplashScreen


class ItqanApp:
    def __init__(self, page: ft.Page):
        self.page = page
        self.state = AppState()
        self.router = None

        self._configure_page()
        self._start_splash_phase()

    def _configure_page(self):
        # 1. Window metadata & geometry
        self.page.title = "إتقان — نظام إدارة الدورات والتدريب"
        self.page.window.icon = "icons/icon.ico"
        self.page.window.width = 1320
        self.page.window.height = 840
        self.page.window.min_width = 1100
        self.page.window.min_height = 700
        self.page.window.alignment = ft.Alignment(0, 0)

        # 2. Appearance & Arabic RTL setup
        self.page.theme_mode = ft.ThemeMode.LIGHT
        self.page.bgcolor = COLORS["bg_app"]
        self.page.padding = 0
        self.page.rtl = True

        # 3. Cairo Typography
        configure_flet_fonts(self.page)

    def _start_splash_phase(self):
        """Displays diagnostic splash screen and verifies system readiness."""
        self.splash = SplashScreen(page=self.page, on_complete=self._build_main_shell)
        self.page.controls = [self.splash]
        self.page.update()

        def _run_diagnostics():
            time.sleep(0.2)
            self.splash.start_checks()

        threading.Thread(target=_run_diagnostics, daemon=True).start()

    def _build_main_shell(self):
        """Builds the full persistent AppShell."""
        # 1. Persistent Stack Content Area
        self.content_stack = ft.Stack(expand=True)

        # 2. Router with pre-mounted page instances
        self.router = Router(
            page=self.page,
            stack=self.content_stack,
            state=self.state,
        )
        self.router.initialize_pages()

        # 3. Header & Sidebar
        self.header = Header(state=self.state, router=self.router)
        self.sidebar = Sidebar(router=self.router, state=self.state)

        # 4. Master Layout (In RTL, sidebar is controls[0] on the RIGHT, content is controls[1] on the LEFT)
        body_row = ft.Row(
            controls=[
                self.sidebar,
                ft.Container(content=self.content_stack, expand=True, bgcolor=COLORS["bg_app"]),
            ],
            spacing=0,
            expand=True,
        )

        master_column = ft.Column(
            controls=[
                self.header,
                body_row,
            ],
            spacing=0,
            expand=True,
        )

        self.page.controls = [master_column]
        self.page.update()

        # Set initial active page
        self.router.navigate("dashboard")
