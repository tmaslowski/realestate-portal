from django.urls import path
from . import views

urlpatterns = [
    path("invite/<int:transaction_id>/", views.invite_buyer),
    path("session/", views.portal_session),
    path("tasks/<int:task_id>/toggle/", views.toggle_task),
    path("agent/invite/<int:agent_id>/", views.invite_agent),
    path("agent/session/", views.agent_session),
]
