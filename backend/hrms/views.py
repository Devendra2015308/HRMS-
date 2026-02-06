from datetime import date
from typing import Any, Dict

from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Attendance, Employee
from .serializers import AttendanceSerializer, EmployeeSerializer


def _parse_date_param(raw: str | None) -> date | None:
    if not raw:
        return None
    parsed = parse_date(raw)
    return parsed


class EmployeeListCreateView(APIView):
    def get(self, _request) -> Response:
        employees = Employee.objects.order_by("created_at")
        serializer = EmployeeSerializer(employees, many=True)
        return Response(serializer.data)

    def post(self, request) -> Response:
        serializer = EmployeeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            serializer.save()
        except IntegrityError:
            return Response(
                {"detail": "Employee ID or email already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class EmployeeDestroyView(APIView):
    def delete(self, _request, employee_id: str) -> Response:
        employee = get_object_or_404(Employee, employee_id=employee_id)
        employee.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AttendanceListCreateView(APIView):
    def get(self, request, employee_id: str) -> Response:
        employee = get_object_or_404(Employee, employee_id=employee_id)
        from_date = _parse_date_param(request.query_params.get("from"))
        to_date = _parse_date_param(request.query_params.get("to"))

        records = Attendance.objects.filter(employee_id=employee.employee_id)
        if from_date:
            records = records.filter(date__gte=from_date)
        if to_date:
            records = records.filter(date__lte=to_date)

        serializer = AttendanceSerializer(records, many=True)
        summary: Dict[str, Any] = {
            "total_records": records.count(),
            "present_days": records.filter(status=Attendance.Status.PRESENT).count(),
            "absent_days": records.filter(status=Attendance.Status.ABSENT).count(),
        }
        return Response(
            {
                "employee": EmployeeSerializer(employee).data,
                "attendance": serializer.data,
                "summary": summary,
            }
        )

    def post(self, request, employee_id: str) -> Response:
        employee = get_object_or_404(Employee, employee_id=employee_id)
        serializer = AttendanceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            attendance = Attendance.objects.create(
                employee_id=employee.employee_id,
                date=serializer.validated_data["date"],
                status=serializer.validated_data["status"],
            )
        except IntegrityError:
            return Response(
                {"detail": "Attendance already marked for this date."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            AttendanceSerializer(attendance).data, status=status.HTTP_201_CREATED
        )


class DashboardSummaryView(APIView):
    def get(self, _request) -> Response:
        employees = Employee.objects.count()
        attendance = Attendance.objects.count()
        present = Attendance.objects.filter(status=Attendance.Status.PRESENT).count()
        absent = Attendance.objects.filter(status=Attendance.Status.ABSENT).count()
        return Response(
            {
                "employees": employees,
                "attendance_records": attendance,
                "present_days": present,
                "absent_days": absent,
            }
        )
