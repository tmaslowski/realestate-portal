import secrets
from datetime import timedelta

from django.db import models
from django.utils import timezone


class Agent(models.Model):
    name = models.CharField(max_length=120)
    email = models.EmailField(unique=True)
    photo_url = models.URLField(blank=True, default="")
    brokerage_logo_url = models.URLField(blank=True, default="")

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
    hero_image_url = models.URLField(blank=True, default="")
    homestead_exemption_url = models.URLField(blank=True, default="")
    review_url = models.URLField(blank=True, default="")

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


class AgentPortalToken(models.Model):
    token = models.CharField(max_length=64, unique=True, db_index=True)
    agent = models.ForeignKey(
        Agent, on_delete=models.CASCADE, related_name="portal_tokens"
    )
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    @staticmethod
    def mint(agent, hours=72):
        return AgentPortalToken.objects.create(
            token=secrets.token_urlsafe(32),
            agent=agent,
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


class Document(models.Model):
    transaction = models.ForeignKey(
        Transaction, on_delete=models.CASCADE, related_name="documents"
    )

    title = models.CharField(max_length=200)
    file = models.FileField(upload_to="documents/")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    hero_image_url = models.URLField(blank=True, default="")

    # Optional metadata
    doc_type = models.CharField(max_length=80, blank=True, default="")
    visible_to_buyer = models.BooleanField(default=True)

    def __str__(self):
        return self.title


class Task(models.Model):
    transaction = models.ForeignKey(
        Transaction, on_delete=models.CASCADE, related_name="tasks"
    )

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    due_date = models.DateField(null=True, blank=True)
    completed = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["completed", "order", "due_date"]

    def __str__(self):
        return self.title


class Vendor(models.Model):
    class Category(models.TextChoices):
        CLOSING_ATTORNEY = "closing_attorney", "Closing Attorney"
        INSPECTOR = "inspector", "Inspector"
        LENDER = "lender", "Lender"
        INSURANCE = "insurance", "Insurance"
        TITLE = "title", "Title/Closing"
        MOVER = "mover", "Mover"
        HANDYMAN = "handyman", "Handyman"
        CLEANER = "cleaner", "Cleaner"
        UTILITY = "utility", "Utility"
        OTHER = "other", "Other"

    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name="vendors")

    category = models.CharField(
        max_length=40, choices=Category.choices, default=Category.OTHER
    )
    name = models.CharField(max_length=160)

    phone = models.CharField(max_length=40, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    website = models.URLField(blank=True, default="")
    notes = models.TextField(blank=True, default="")

    is_favorite = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"


class TransactionVendor(models.Model):
    class Role(models.TextChoices):
        CLOSING_ATTORNEY = "closing_attorney", "Closing Attorney"
        PREFERRED_VENDOR = "preferred_vendor", "Preferred Vendor"
        UTILITY = "utility", "Utility"

    transaction = models.ForeignKey(
        Transaction, on_delete=models.CASCADE, related_name="transaction_vendors"
    )
    vendor = models.ForeignKey(
        Vendor, on_delete=models.CASCADE, related_name="transaction_links"
    )

    role = models.CharField(
        max_length=40, choices=Role.choices, default=Role.PREFERRED_VENDOR
    )
    sort_order = models.PositiveIntegerField(default=0)

    # Optional per-transaction override notes (e.g., “Call after 5pm”)
    notes_override = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "id"]
        unique_together = [("transaction", "vendor", "role")]

    def __str__(self):
        return f"{self.transaction_id}: {self.vendor.name} ({self.get_role_display()})"


class AgentFAQ(models.Model):
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name="faqs")

    question = models.CharField(max_length=220)
    answer = models.TextField()

    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return self.question
