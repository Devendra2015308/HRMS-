from django.contrib import admin

from .models import Attendance, Employee


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("employee_id", "full_name", "email", "department", "created_at")
    search_fields = ("employee_id", "full_name", "email", "department")


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ("employee_id", "date", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("employee_id", "date")
