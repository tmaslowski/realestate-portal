from django.contrib import admin
from .models import Agent, Buyer, Transaction, PortalToken, Utility, Document


@admin.register(Agent)
class AgentAdmin(admin.ModelAdmin):
    list_display = ("name", "email")
    search_fields = ("name", "email")


@admin.register(Buyer)
class BuyerAdmin(admin.ModelAdmin):
    list_display = ("name", "email")
    search_fields = ("name", "email")


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
    search_fields = ("address", "agent__email", "buyer__email", "lofty_transaction_id")


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
    list_filter = ("doc_type", "visible_to_buyer")
    search_fields = ("title", "doc_type")
