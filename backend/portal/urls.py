from django.urls import path
from . import views

urlpatterns = [
    # --- Buyer Portal ---
    path("invite/<int:transaction_id>/", views.invite_buyer),
    path("session/", views.portal_session),
    path("tasks/<int:task_id>/toggle/", views.toggle_task),
    # --- Agent Portal ---
    path("agent/signup/", views.agent_signup),
    path("agent/invite/<int:agent_id>/", views.invite_agent),
    path("agent/session/", views.agent_session),
    # Transactions
    path("agent/transaction/create/", views.agent_transaction_create),
    path("agent/transaction/<int:transaction_id>/", views.agent_transaction),
    # Vendors & Utilities
    path("agent/vendors/", views.agent_vendors),
    path("agent/vendor/create/", views.agent_vendor_create),
    path(
        "agent/transaction/<int:transaction_id>/vendors/",
        views.agent_set_transaction_vendors,
    ),
    # Added to match the fetch call in AgentSetup.jsx saveVendors()
    path(
        "agent/transaction/<int:transaction_id>/utilities/set/",
        views.agent_set_transaction_vendors,
    ),
]
