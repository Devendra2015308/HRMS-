from djongo import models


class Employee(models.Model):
    employee_id = models.CharField(max_length=32, unique=True)
    full_name = models.CharField(max_length=120)
    email = models.EmailField(unique=True)
    department = models.CharField(max_length=80)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.employee_id} - {self.full_name}"


class Attendance(models.Model):
    class Status(models.TextChoices):
        PRESENT = "present", "Present"
        ABSENT = "absent", "Absent"

    employee_id = models.CharField(max_length=32)
    date = models.DateField()
    status = models.CharField(max_length=10, choices=Status.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("employee_id", "date")
        ordering = ["-date", "-created_at"]

    def __str__(self) -> str:
        return f"{self.employee_id} - {self.date} - {self.status}"
