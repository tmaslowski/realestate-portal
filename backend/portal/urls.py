from django.urls import path
from . import views

urlpatterns = [
    path("invite/<int:transaction_id>/", views.invite_buyer),
    path("session/", views.portal_session),
    path("tasks/<int:task_id>/toggle/", views.toggle_task),
    path("agent/invite/<int:agent_id>/", views.invite_agent),
    path("agent/session/", views.agent_session),
    path("agent/transaction/<int:transaction_id>/", views.agent_transaction),
    path("agent/vendors/", views.agent_vendors),
    path("agent/vendor/create/", views.agent_vendor_create),
    path(
        "agent/transaction/<int:transaction_id>/vendors/",
        views.agent_set_transaction_vendors,
    ),
]
