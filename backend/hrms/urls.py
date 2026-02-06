from django.urls import path

from .views import (
    AttendanceListCreateView,
    DashboardSummaryView,
    EmployeeDestroyView,
    EmployeeListCreateView,
)

urlpatterns = [
    path("employees/", EmployeeListCreateView.as_view(), name="employees"),
    path(
        "employees/<str:employee_id>/",
        EmployeeDestroyView.as_view(),
        name="employee-delete",
    ),
    path(
        "employees/<str:employee_id>/attendance/",
        AttendanceListCreateView.as_view(),
        name="attendance",
    ),
    path("dashboard/", DashboardSummaryView.as_view(), name="dashboard"),
]
