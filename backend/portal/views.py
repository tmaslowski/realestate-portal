from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Transaction, PortalToken
from .serializers import TransactionSerializer


@api_view(["POST"])
def invite_buyer(request, transaction_id):
    """
    Demo-friendly: returns a magic link instead of emailing it.
    Later we can send email via AWS SES.
    """
    try:
        txn = Transaction.objects.select_related("buyer", "agent").get(
            id=transaction_id
        )
    except Transaction.DoesNotExist:
        return Response(
            {"error": "transaction not found"}, status=status.HTTP_404_NOT_FOUND
        )

    token = PortalToken.mint(txn, hours=72)
    link = f"http://localhost:5173/?t={token.token}"

    return Response(
        {
            "transaction_id": txn.id,
            "token": token.token,
            "expires_at": token.expires_at,
            "link": link,
        }
    )


@api_view(["GET"])
def portal_session(request):
    """
    Buyer UI calls this with ?t=TOKEN
    """
    token_value = request.query_params.get("t", "")
    if not token_value:
        return Response({"error": "missing token"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        t = PortalToken.objects.select_related(
            "transaction", "transaction__buyer", "transaction__agent"
        ).get(token=token_value)
    except PortalToken.DoesNotExist:
        return Response({"error": "invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

    if not t.is_valid():
        return Response({"error": "expired token"}, status=status.HTTP_401_UNAUTHORIZED)

    txn = t.transaction

    tasks = [
        {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "due_date": task.due_date,
            "completed": task.completed,
        }
        for task in txn.tasks.all()
    ]

    utilities = [
        {
            "id": u.id,
            "category": u.category,
            "category_label": u.get_category_display(),
            "provider_name": u.provider_name,
            "phone": u.phone,
            "website": u.website,
            "account_number_hint": u.account_number_hint,
            "notes": u.notes,
            "due_date": u.due_date,
        }
        for u in txn.utilities.order_by("category", "provider_name")
    ]
    documents = [
        {
            "id": d.id,
            "title": d.title,
            "doc_type": d.doc_type,
            "url": d.file.url,
            "uploaded_at": d.uploaded_at,
        }
        for d in txn.documents.filter(visible_to_buyer=True).order_by("-uploaded_at")
    ]

    return Response(
        {
            "buyer": {"name": txn.buyer.name, "email": txn.buyer.email},
            "agent": {
                "name": txn.agent.name,
                "email": txn.agent.email,
                "photo_url": txn.agent.photo_url,
            },
            "property": {"address": txn.address, "hero_image_url": txn.hero_image_url},
            "transaction": TransactionSerializer(txn).data,
            "tasks": tasks,
            "utilities": utilities,
            "documents": documents,
        }
    )


@api_view(["POST"])
def toggle_task(request, task_id):
    from .models import Task

    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response({"error": "task not found"}, status=404)

    task.completed = not task.completed
    task.save(update_fields=["completed"])
    return Response({"id": task.id, "completed": task.completed})
