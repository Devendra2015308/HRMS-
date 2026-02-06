from typing import Any

from rest_framework import serializers

from .models import Attendance, Employee


class EmployeeSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    class Meta:
        model = Employee
        fields = ["id", "employee_id", "full_name", "email", "department", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_email(self, value: str) -> str:
        return value.lower()

    def to_representation(self, instance: Employee) -> dict[str, Any]:
        data = super().to_representation(instance)
        if instance.pk is not None:
            data["id"] = str(instance.pk)
        else:
            data["id"] = instance.employee_id
        return data


class AttendanceSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    employee_id = serializers.CharField(read_only=True)

    class Meta:
        model = Attendance
        fields = ["id", "employee_id", "date", "status", "created_at"]
        read_only_fields = ["id", "employee_id", "created_at"]

    def validate_status(self, value: str) -> str:
        normalized = value.lower()
        if normalized not in {Attendance.Status.PRESENT, Attendance.Status.ABSENT}:
            raise serializers.ValidationError(
                "Status must be 'present' or 'absent'."
            )
        return normalized

    def to_representation(self, instance: Attendance) -> dict[str, Any]:
        data = super().to_representation(instance)
        if instance.pk is not None:
            data["id"] = str(instance.pk)
        data["status"] = instance.get_status_display()
        return data
