from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import (
    Agent,
    AgentPortalToken,
    Transaction,
    PortalToken,
    Utility,
    Document,
    Task,
    TransactionVendor,
    Vendor,
)
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


def _get_agent_from_token(request):
    token_value = request.query_params.get("t", "")
    if not token_value:
        return None, Response(
            {"error": "missing token"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        at = AgentPortalToken.objects.select_related("agent").get(token=token_value)
    except AgentPortalToken.DoesNotExist:
        return None, Response(
            {"error": "invalid token"}, status=status.HTTP_401_UNAUTHORIZED
        )

    if not at.is_valid():
        return None, Response(
            {"error": "expired token"}, status=status.HTTP_401_UNAUTHORIZED
        )

    return at.agent, None


@api_view(["POST"])
def invite_agent(request, agent_id):
    """
    Demo-friendly: returns an agent magic link instead of emailing it.
    Later we can send via AWS SES.
    """
    try:
        agent = Agent.objects.get(id=agent_id)
    except Agent.DoesNotExist:
        return Response({"error": "agent not found"}, status=status.HTTP_404_NOT_FOUND)

    token = AgentPortalToken.mint(agent, hours=72)
    link = f"http://localhost:5173/agent?t={token.token}"

    return Response(
        {
            "agent_id": agent.id,
            "token": token.token,
            "expires_at": token.expires_at,
            "link": link,
        }
    )


@api_view(["GET"])
def agent_session(request):
    """
    Agent UI bootstrap:
    - validates agent token (?t=...)
    - returns agent profile + list of their transactions
    """
    token_value = request.query_params.get("t", "")
    if not token_value:
        return Response({"error": "missing token"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        t = AgentPortalToken.objects.select_related("agent").get(token=token_value)
    except AgentPortalToken.DoesNotExist:
        return Response({"error": "invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

    if not t.is_valid():
        return Response({"error": "expired token"}, status=status.HTTP_401_UNAUTHORIZED)

    agent = t.agent

    # Transactions for this agent
    txns = agent.transactions.select_related("buyer").order_by("-created_at")

    transactions = [
        {
            "id": txn.id,
            "address": txn.address,
            "status": txn.status,
            "closing_date": txn.closing_date,
            "buyer_name": txn.buyer.name if txn.buyer_id else "",
        }
        for txn in txns
    ]

    return Response(
        {
            "agent": {
                "id": agent.id,
                "name": agent.name,
                "email": agent.email,
                "photo_url": getattr(agent, "photo_url", ""),
                "brokerage_logo_url": getattr(agent, "brokerage_logo_url", ""),
            },
            "transactions": transactions,
            # Keep this for forward compatibility (your UI expects it)
            "favorites": [],
        }
    )


@api_view(["GET", "PATCH"])
def agent_transaction(request, transaction_id):
    """
    Agent UI loads/saves one transaction's editable fields.
    Auth: AgentPortalToken passed as ?t=TOKEN

    GET  -> returns transaction payload (same shape as buyer session, but scoped)
    PATCH -> updates allowed fields, returns refreshed payload
    """
    agent, err = _get_agent_from_token(request)
    if err:
        return err

    try:
        txn = (
            Transaction.objects.select_related("buyer", "agent")
            .prefetch_related(
                "tasks", "utilities", "documents", "transaction_vendors__vendor"
            )
            .get(id=transaction_id, agent=agent)
        )
    except Transaction.DoesNotExist:
        return Response(
            {"error": "transaction not found"}, status=status.HTTP_404_NOT_FOUND
        )

    # --- PATCH allowed fields ---
    if request.method == "PATCH":
        payload = request.data or {}

        # Transaction fields
        if "address" in payload:
            txn.address = payload.get("address", "") or ""
        if "closing_date" in payload:
            cd = payload.get("closing_date")
            txn.closing_date = cd or None
        if "hero_image_url" in payload:
            txn.hero_image_url = payload.get("hero_image_url", "") or ""
        if "homestead_exemption_url" in payload:
            txn.homestead_exemption_url = (
                payload.get("homestead_exemption_url", "") or ""
            )
        if "review_url" in payload:
            txn.review_url = payload.get("review_url", "") or ""

        txn.save()

    # --- build payload (mirrors buyer session shape where useful) ---
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

    closing_attorney = None
    preferred_vendors = []

    tv_qs = txn.transaction_vendors.select_related("vendor").all()
    for tv in tv_qs:
        v = tv.vendor
        payload = {
            "id": v.id,
            "name": v.name,
            "category": v.category,
            "category_label": v.get_category_display(),
            "phone": v.phone,
            "email": v.email,
            "website": v.website,
            "notes": tv.notes_override or v.notes,
            "is_favorite": v.is_favorite,
        }
        if tv.role == TransactionVendor.Role.CLOSING_ATTORNEY:
            closing_attorney = payload
        elif tv.role == TransactionVendor.Role.PREFERRED_VENDOR:
            preferred_vendors.append(payload)

    faqs = (
        [
            {"id": f.id, "q": f.question, "a": f.answer}
            for f in txn.agent.faqs.filter(is_active=True).order_by("sort_order", "id")
        ]
        if hasattr(txn.agent, "faqs")
        else []
    )

    return Response(
        {
            "buyer": {"name": txn.buyer.name, "email": txn.buyer.email},
            "agent": {
                "name": txn.agent.name,
                "email": txn.agent.email,
                "photo_url": getattr(txn.agent, "photo_url", ""),
                "brokerage_logo_url": getattr(txn.agent, "brokerage_logo_url", ""),
            },
            "property": {"address": txn.address, "hero_image_url": txn.hero_image_url},
            "transaction": TransactionSerializer(txn).data,
            "tasks": tasks,
            "utilities": utilities,
            "documents": documents,
            "closing_attorney": closing_attorney,
            "preferred_vendors": preferred_vendors,
            "homestead_exemption_url": getattr(txn, "homestead_exemption_url", ""),
            "review_url": getattr(txn, "review_url", ""),
            "faqs": faqs,
        }
    )
    return Response(
        {
            "agent": {
                "id": agent.id,
                "name": agent.name,
                "email": agent.email,
                "photo_url": agent.photo_url,
                "brokerage_logo_url": getattr(agent, "brokerage_logo_url", ""),
            },
            "transactions": transactions,
            "favorites": favorites,
        }
    )

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

    closing_attorney = None
    preferred_vendors = []

    tv_qs = txn.transaction_vendors.select_related("vendor").all()

    for tv in tv_qs:
        v = tv.vendor
        payload = {
            "id": v.id,
            "name": v.name,
            "category": v.category,
            "category_label": v.get_category_display(),
            "phone": v.phone,
            "email": v.email,
            "website": v.website,
            "notes": tv.notes_override or v.notes,
            "is_favorite": v.is_favorite,
        }
        if tv.role == TransactionVendor.Role.CLOSING_ATTORNEY:
            closing_attorney = payload
        elif tv.role == TransactionVendor.Role.PREFERRED_VENDOR:
            preferred_vendors.append(payload)

    faqs = [
        {"id": f.id, "q": f.question, "a": f.answer}
        for f in txn.agent.faqs.filter(is_active=True).order_by("sort_order", "id")
    ]

    return Response(
        {
            "buyer": {"name": txn.buyer.name, "email": txn.buyer.email},
            "agent": {
                "name": txn.agent.name,
                "email": txn.agent.email,
                "photo_url": txn.agent.photo_url,
                "brokerage_logo_url": txn.agent.brokerage_logo_url,
            },
            "property": {"address": txn.address, "hero_image_url": txn.hero_image_url},
            "transaction": TransactionSerializer(txn).data,
            "tasks": tasks,
            "utilities": utilities,
            "documents": documents,
            "closing_attorney": closing_attorney,
            "preferred_vendors": preferred_vendors,
            "homestead_exemption_url": txn.homestead_exemption_url,
            "review_url": txn.review_url,
            "faqs": faqs,
        }
    )


@api_view(["GET"])
def agent_vendors(request):
    """
    Returns favorite vendors for this agent (used by AgentSetup.jsx).
    GET /api/portal/agent/vendors/?t=TOKEN
    """
    token_value = request.query_params.get("t", "")
    if not token_value:
        return Response({"error": "missing token"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        t = AgentPortalToken.objects.select_related("agent").get(token=token_value)
    except AgentPortalToken.DoesNotExist:
        return Response({"error": "invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

    if not t.is_valid():
        return Response({"error": "expired token"}, status=status.HTTP_401_UNAUTHORIZED)

    agent = t.agent

    qs = Vendor.objects.filter(agent=agent, is_favorite=True).order_by(
        "category", "name"
    )

    favorites = [
        {
            "id": v.id,
            "name": v.name,
            "category": v.category,
            "category_label": v.get_category_display(),
            "phone": v.phone,
            "email": v.email,
            "website": v.website,
            "notes": v.notes,
            "is_favorite": v.is_favorite,
        }
        for v in qs
    ]

    return Response({"favorites": favorites})


@api_view(["POST"])
def agent_vendor_create(request):
    token_value = request.query_params.get("t", "")
    if not token_value:
        return Response({"error": "missing token"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        t = AgentPortalToken.objects.select_related("agent").get(token=token_value)
    except AgentPortalToken.DoesNotExist:
        return Response({"error": "invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

    if not t.is_valid():
        return Response({"error": "expired token"}, status=status.HTTP_401_UNAUTHORIZED)

    agent = t.agent

    name = (request.data.get("name") or "").strip()
    if not name:
        return Response(
            {"error": "name is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    vendor = Vendor.objects.create(
        agent=agent,  # ✅ THIS is the missing piece
        name=name,
        category=request.data.get("category") or Vendor.Category.OTHER,
        phone=request.data.get("phone") or "",
        email=request.data.get("email") or "",
        website=request.data.get("website") or "",
        notes=request.data.get("notes") or "",
        is_favorite=bool(request.data.get("is_favorite", True)),
    )

    return Response(
        {
            "id": vendor.id,
            "name": vendor.name,
            "category": vendor.category,
            "category_label": vendor.get_category_display(),
            "phone": vendor.phone,
            "email": vendor.email,
            "website": vendor.website,
            "notes": vendor.notes,
            "is_favorite": vendor.is_favorite,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
def agent_set_transaction_vendors(request, transaction_id):
    """
    Sets the closing attorney + preferred vendors for a transaction.
    Auth: AgentPortalToken in ?t=
    Body:
      {
        closing_attorney_vendor_id: number|null,
        preferred_vendor_ids: number[]
      }
    """
    agent, err = _get_agent_from_token(request)
    if err:
        return err

    try:
        txn = Transaction.objects.get(id=transaction_id, agent=agent)
    except Transaction.DoesNotExist:
        return Response({"error": "transaction not found"}, status=404)

    payload = request.data or {}
    closing_id = payload.get("closing_attorney_vendor_id")
    preferred_ids = payload.get("preferred_vendor_ids") or []

    # Clear existing vendor links for these roles
    txn.transaction_vendors.filter(
        role__in=[
            TransactionVendor.Role.CLOSING_ATTORNEY,
            TransactionVendor.Role.PREFERRED_VENDOR,
        ]
    ).delete()

    # Closing attorney (optional)
    if closing_id:
        try:
            v = Vendor.objects.get(id=closing_id)
        except Vendor.DoesNotExist:
            return Response({"error": "closing attorney vendor not found"}, status=400)

        TransactionVendor.objects.create(
            transaction=txn,
            vendor=v,
            role=TransactionVendor.Role.CLOSING_ATTORNEY,
        )

    # Preferred vendors (0..n)
    if preferred_ids:
        vendors = Vendor.objects.filter(id__in=preferred_ids)
        for v in vendors:
            TransactionVendor.objects.create(
                transaction=txn,
                vendor=v,
                role=TransactionVendor.Role.PREFERRED_VENDOR,
            )

    return Response({"ok": True})


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
