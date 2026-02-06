from django.contrib import admin
from .models import (
    Agent,
    Buyer,
    Transaction,
    PortalToken,
    Utility,
    Document,
    Task,
    Vendor,
    TransactionVendor,
    AgentFAQ,
)


@admin.register(Agent)
class AgentAdmin(admin.ModelAdmin):
    list_display = ("name", "email")
    search_fields = ("name", "email")


@admin.register(Buyer)
class BuyerAdmin(admin.ModelAdmin):
    list_display = ("name", "email")
    search_fields = ("name", "email")


@admin.register(PortalToken)
class PortalTokenAdmin(admin.ModelAdmin):
    list_display = ("token", "transaction", "expires_at", "created_at")
    search_fields = ("token",)
    list_filter = ("expires_at",)


@admin.register(Utility)
class UtilityAdmin(admin.ModelAdmin):
    list_display = ("category", "provider_name", "phone", "transaction", "due_date")
    list_filter = ("category",)
    search_fields = ("provider_name", "phone", "website", "notes")


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "transaction",
        "doc_type",
        "visible_to_buyer",
        "uploaded_at",
    )
    search_fields = ("title", "doc_type", "transaction__address")
    list_filter = ("visible_to_buyer", "doc_type")


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "transaction", "completed", "due_date", "order")
    list_filter = ("completed",)
    search_fields = ("title", "description")
    ordering = ("order",)


class TransactionVendorInline(admin.TabularInline):
    model = TransactionVendor
    extra = 0
    autocomplete_fields = ["vendor"]
    fields = ("role", "vendor", "sort_order", "notes_override")
    ordering = ("role", "sort_order")


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ("name", "agent", "category", "is_favorite", "phone", "website")
    list_filter = ("category", "is_favorite")
    search_fields = ("name", "phone", "email", "website", "notes")
    autocomplete_fields = ("agent",)


@admin.register(AgentFAQ)
class AgentFAQAdmin(admin.ModelAdmin):
    list_display = ("question", "agent", "is_active", "sort_order")
    list_filter = ("is_active",)
    search_fields = ("question", "answer")
    autocomplete_fields = ("agent",)
    ordering = ("agent", "sort_order")


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "address",
        "status",
        "closing_date",
        "agent",
        "buyer",
        "lofty_transaction_id",
    )
    list_filter = ("status",)
    search_fields = (
        "address",
        "agent__email",
        "buyer__email",
        "buyer__name",
        "lofty_transaction_id",
    )
    autocomplete_fields = ("agent", "buyer")
    inlines = [TransactionVendorInline]
