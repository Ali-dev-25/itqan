"""
Itqan - Ultra-Fast Zero-Flicker Page Router
Uses an ft.Stack with pre-mounted page containers and instantaneous visibility toggling.
Eliminates control destruction, DOM rebuilds, layout shifts, and visual flashes.
"""

import time
import flet as ft
from pages.dashboard_page import DashboardPage
from pages.students_page import StudentsPage
from pages.trainers_page import TrainersPage
from pages.courses_page import CoursesPage
from pages.batches_page import BatchesPage
from pages.reports_page import ReportsPage
from pages.exports_page import ExportsPage
from pages.settings_page import SettingsPage


class Router:
    PAGE_CLASSES = {
        "dashboard": DashboardPage,
        "students":  StudentsPage,
        "trainers":  TrainersPage,
        "courses":   CoursesPage,
        "batches":   BatchesPage,
        "reports":   ReportsPage,
        "exports":   ExportsPage,
        "settings":  SettingsPage,
    }

    PAGE_NAMES = {
        "dashboard": "Dashboard (الرئيسية)",
        "students":  "Students (الطلاب)",
        "trainers":  "Trainers (المدربون)",
        "courses":   "Courses (الدورات)",
        "batches":   "Batches (الدفعات)",
        "reports":   "Reports (التقارير)",
        "exports":   "Exports (تصدير البيانات)",
        "settings":  "Settings (الإعدادات)",
    }

    def __init__(self, page: ft.Page, stack: ft.Stack, state, enable_profiling: bool = False):
        self.page = page
        self.stack = stack
        self.state = state
        self.enable_profiling = enable_profiling
        self._page_containers: dict[str, ft.Container] = {}
        self._page_instances: dict[str, ft.Control] = {}
        self.active_page_id = "dashboard"

    def initialize_pages(self):
        """Initializes and mounts all 8 pages into the persistent Stack."""
        stack_controls = []
        for pid, pcls in self.PAGE_CLASSES.items():
            instance = pcls(router=self, state=self.state)
            self._page_instances[pid] = instance
            
            # Wrap in a Container for clean visibility toggle and layout containment
            container = ft.Container(
                content=instance,
                visible=(pid == self.active_page_id),
                expand=True,
                padding=0,
            )
            self._page_containers[pid] = container
            stack_controls.append(container)

        self.stack.controls = stack_controls

    def navigate(self, page_id: str):
        """Switches instantaneously to the target page via GPU visibility toggle."""
        if page_id not in self.PAGE_CLASSES:
            print(f"[Router] Warning: Unknown page {page_id}")
            return

        t_start = time.perf_counter()

        # 1. Update State (Updates Header & Sidebar visual indicators)
        self.state.navigate_to(page_id)
        self.active_page_id = page_id

        # 2. Toggle visibility on all pre-mounted stack containers
        for pid, container in self._page_containers.items():
            container.visible = (pid == page_id)

        # 3. Update the Stack container only
        t_update_start = time.perf_counter()
        try:
            if self.stack.page:
                self.stack.update()
            elif self.page:
                self.page.update()
        except Exception:
            pass

        t_update = (time.perf_counter() - t_update_start) * 1000
        t_total = (time.perf_counter() - t_start) * 1000

        if self.enable_profiling:
            print(f"[Navigation]\n"
                  f"  Page:      {self.PAGE_NAMES.get(page_id, page_id)}\n"
                  f"  Route:     {page_id}\n"
                  f"  Stack GPU: Instant Toggle\n"
                  f"  Update:    {t_update:.2f} ms\n"
                  f"  Total:     {t_total:.2f} ms")

    def get_page_instance(self, page_id: str):
        return self._page_instances.get(page_id)
