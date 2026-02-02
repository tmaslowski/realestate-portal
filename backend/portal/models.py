import secrets
from datetime import timedelta

from django.db import models
from django.utils import timezone


class Agent(models.Model):
    name = models.CharField(max_length=120)
    email = models.EmailField(unique=True)

    def __str__(self):
        return f"{self.name} <{self.email}>"


class Buyer(models.Model):
    name = models.CharField(max_length=120)
    email = models.EmailField()

    def __str__(self):
        return f"{self.name} <{self.email}>"


class Transaction(models.Model):
    agent = models.ForeignKey(
        Agent, on_delete=models.CASCADE, related_name="transactions"
    )
    buyer = models.ForeignKey(
        Buyer, on_delete=models.CASCADE, related_name="transactions"
    )

    address = models.CharField(max_length=200)
    status = models.CharField(max_length=60, default="Active")
    closing_date = models.DateField(null=True, blank=True)

    # Optional: future Lofty mapping
    lofty_transaction_id = models.CharField(max_length=64, blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Txn #{self.id}: {self.address}"


class PortalToken(models.Model):
    token = models.CharField(max_length=64, unique=True, db_index=True)
    transaction = models.ForeignKey(
        Transaction, on_delete=models.CASCADE, related_name="portal_tokens"
    )
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    @staticmethod
    def mint(transaction, hours=72):
        return PortalToken.objects.create(
            token=secrets.token_urlsafe(32),
            transaction=transaction,
            expires_at=timezone.now() + timedelta(hours=hours),
        )

    def is_valid(self):
        return timezone.now() < self.expires_at


class Utility(models.Model):
    class Category(models.TextChoices):
        POWER = "power", "Power"
        WATER = "water", "Water"
        GAS = "gas", "Gas"
        INTERNET = "internet", "Internet"
        TRASH = "trash", "Trash"
        HOA = "hoa", "HOA"
        OTHER = "other", "Other"

    transaction = models.ForeignKey(
        Transaction, on_delete=models.CASCADE, related_name="utilities"
    )

    category = models.CharField(
        max_length=20, choices=Category.choices, default=Category.OTHER
    )
    provider_name = models.CharField(max_length=160)
    phone = models.CharField(max_length=40, blank=True, default="")
    website = models.URLField(blank=True, default="")
    account_number_hint = models.CharField(
        max_length=80, blank=True, default=""
    )  # optional
    notes = models.TextField(blank=True, default="")
    due_date = models.DateField(null=True, blank=True)  # optional “set up by” date

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_category_display()}: {self.provider_name}"
