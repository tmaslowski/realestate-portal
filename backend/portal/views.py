from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import (
    Agent,
    Buyer,
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


# -----------------------------
# Buyer Portal (magic link)
# -----------------------------
# ---------- Defaults for new Transactions (demo-friendly templates) ----------

DEFAULT_TASK_TEMPLATES = [
    {
        "title": "Schedule home inspection",
        "description": "Coordinate with buyer + inspector.",
        "order": 10,
    },
    {
        "title": "Review inspection report",
        "description": "Discuss repairs / concessions.",
        "order": 20,
    },
    {
        "title": "Confirm appraisal scheduled",
        "description": "Lender will coordinate appraisal.",
        "order": 30,
    },
    {
        "title": "Shop homeowners insurance",
        "description": "Buyer to bind policy before closing.",
        "order": 40,
    },
    {
        "title": "Set up utilities (power/water/internet)",
        "description": "Transfer service effective on closing date.",
        "order": 50,
    },
    {
        "title": "Review Closing Disclosure (CD)",
        "description": "Buyer signs and confirms cash-to-close.",
        "order": 60,
    },
    {
        "title": "Final walkthrough",
        "description": "Confirm property condition before closing.",
        "order": 70,
    },
    {
        "title": "Bring ID + funds to closing",
        "description": "Wire/Certified funds per attorney instructions.",
        "order": 80,
    },
]

DEFAULT_UTILITY_TEMPLATES = [
    {"category": "power", "provider_name": "Power Company (add provider)"},
    {"category": "water", "provider_name": "Water Company (add provider)"},
    {"category": "gas", "provider_name": "Gas Company (if applicable)"},
    {"category": "internet", "provider_name": "Internet Provider (add provider)"},
    {"category": "trash", "provider_name": "Trash Service (if applicable)"},
    {"category": "hoa", "provider_name": "HOA Contact (if applicable)"},
]


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def invite_buyer(request, transaction_id):
    """
    Demo-friendly: returns a magic link instead of emailing it.
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
@authentication_classes([])
@permission_classes([AllowAny])
def portal_session(request):
    """
    Buyer UI calls this with ?t=TOKEN
    """
    token_value = request.query_params.get("t", "")
    if not token_value:
        return Response({"error": "missing token"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        pt = PortalToken.objects.select_related(
            "transaction", "transaction__buyer", "transaction__agent"
        ).get(token=token_value)
    except PortalToken.DoesNotExist:
        return Response({"error": "invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

    if not pt.is_valid():
        return Response({"error": "expired token"}, status=status.HTTP_401_UNAUTHORIZED)

    txn = pt.transaction

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
            "doc_type": getattr(d, "doc_type", ""),
            "url": (
                getattr(d, "url", "")
                or (d.file.url if hasattr(d, "file") and getattr(d, "file") else "")
            ),
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
            if str(v.category) != "utility":
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
            "my_documents_url": getattr(txn, "my_documents_url", ""),
        }
    )


# -----------------------------
# Agent Portal (magic link)
# -----------------------------


def _extract_agent_token(request):
    # Prefer header token (safer than querystring)
    header_token = request.headers.get("X-Agent-Token", "")
    if header_token:
        return header_token.strip()

    # Optional: support Authorization: Bearer <token>
    auth = request.headers.get("Authorization", "")
    if auth.lower().startswith("bearer "):
        return auth.split(" ", 1)[1].strip()

    # Backward compatible fallback
    return (request.query_params.get("t", "") or "").strip()


def _get_agent_from_token(request):
    token_value = _extract_agent_token(request)
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
@authentication_classes([])
@permission_classes([AllowAny])
def invite_agent(request, agent_id):
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
@authentication_classes([])
@permission_classes([AllowAny])
def agent_session(request):
    agent, err = _get_agent_from_token(request)
    if err:
        return err

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

    favs_qs = Vendor.objects.filter(agent=agent, is_favorite=True).order_by(
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
        for v in favs_qs
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
            "favorites": favorites,
        }
    )


@api_view(["GET", "PATCH"])
@authentication_classes([])
@permission_classes([AllowAny])
def agent_transaction(request, transaction_id):
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

    if request.method == "PATCH":
        payload = request.data or {}

        if "address" in payload:
            txn.address = payload.get("address", "") or ""
        if "closing_date" in payload:
            txn.closing_date = payload.get("closing_date") or None
        if "hero_image_url" in payload:
            txn.hero_image_url = payload.get("hero_image_url", "") or ""
        if "homestead_exemption_url" in payload:
            txn.homestead_exemption_url = (
                payload.get("homestead_exemption_url", "") or ""
            )
        if "my_documents_url" in payload:
            txn.my_documents_url = payload.get("my_documents_url", "") or ""
        if "review_url" in payload:
            txn.review_url = payload.get("review_url", "") or ""

        txn.save()

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
            "doc_type": getattr(d, "doc_type", ""),
            "url": (
                getattr(d, "url", "")
                or (d.file.url if hasattr(d, "file") and getattr(d, "file") else "")
            ),
            "uploaded_at": d.uploaded_at,
        }
        for d in txn.documents.filter(visible_to_buyer=True).order_by("-uploaded_at")
    ]

    closing_attorney = None
    preferred_vendors = []
    utility_providers = []

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
            if str(v.category) != "utility":
                preferred_vendors.append(payload)
        elif (
            hasattr(TransactionVendor.Role, "UTILITY_PROVIDER")
            and tv.role == TransactionVendor.Role.UTILITY_PROVIDER
        ):
            utility_providers.append(payload)

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
            "utility_providers": utility_providers,
            "homestead_exemption_url": getattr(txn, "homestead_exemption_url", ""),
            "review_url": getattr(txn, "review_url", ""),
            "faqs": faqs,
            "my_documents_url": getattr(txn, "my_documents_url", ""),
        }
    )


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def agent_vendors(request):
    agent, err = _get_agent_from_token(request)
    if err:
        return err

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
@authentication_classes([])
@permission_classes([AllowAny])
def agent_vendor_create(request):
    agent, err = _get_agent_from_token(request)
    if err:
        return err

    name = (request.data.get("name") or "").strip()
    if not name:
        return Response(
            {"error": "name is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    vendor = Vendor.objects.create(
        agent=agent,
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
@authentication_classes([])
@permission_classes([AllowAny])
def agent_set_transaction_vendors(request, transaction_id):
    agent, err = _get_agent_from_token(request)
    if err:
        return err

    try:
        txn = Transaction.objects.get(id=transaction_id, agent=agent)
    except Transaction.DoesNotExist:
        return Response(
            {"error": "transaction not found"}, status=status.HTTP_404_NOT_FOUND
        )

    payload = request.data or {}
    closing_id = payload.get("closing_attorney_vendor_id")
    preferred_ids = payload.get("preferred_vendor_ids") or []
    utility_ids = payload.get("utility_provider_ids") or []

    roles_to_clear = [
        TransactionVendor.Role.CLOSING_ATTORNEY,
        TransactionVendor.Role.PREFERRED_VENDOR,
    ]
    if hasattr(TransactionVendor.Role, "UTILITY_PROVIDER"):
        roles_to_clear.append(TransactionVendor.Role.UTILITY_PROVIDER)

    txn.transaction_vendors.filter(role__in=roles_to_clear).delete()

    if closing_id:
        try:
            v = Vendor.objects.get(id=closing_id, agent=agent)
        except Vendor.DoesNotExist:
            return Response(
                {"error": "closing attorney vendor not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        TransactionVendor.objects.create(
            transaction=txn,
            vendor=v,
            role=TransactionVendor.Role.CLOSING_ATTORNEY,
        )

    if preferred_ids:
        bad = Vendor.objects.filter(
            id__in=preferred_ids, agent=agent, category="utility"
        )
        if bad.exists():
            return Response(
                {
                    "error": "Utilities cannot be added as preferred vendors. Use Utilities instead."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        vendors = Vendor.objects.filter(id__in=preferred_ids, agent=agent).exclude(
            category="utility"
        )
        for v in vendors:
            TransactionVendor.objects.create(
                transaction=txn,
                vendor=v,
                role=TransactionVendor.Role.PREFERRED_VENDOR,
            )

    if hasattr(TransactionVendor.Role, "UTILITY_PROVIDER"):
        if utility_ids:
            utility_vendors = Vendor.objects.filter(
                id__in=utility_ids, agent=agent, category="utility"
            )
            for v in utility_vendors:
                TransactionVendor.objects.create(
                    transaction=txn,
                    vendor=v,
                    role=TransactionVendor.Role.UTILITY_PROVIDER,
                )

            txn.utilities.all().delete()
            Utility.objects.bulk_create(
                [
                    Utility(
                        transaction=txn,
                        category=Utility.Category.OTHER
                        if hasattr(Utility, "Category")
                        else "other",
                        provider_name=v.name,
                        phone=v.phone or "",
                        website=v.website or "",
                        account_number_hint="",
                        notes=v.notes or "",
                        due_date=None,
                    )
                    for v in utility_vendors
                ]
            )
        else:
            txn.utilities.all().delete()

    return Response({"ok": True})


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def agent_transaction_create(request):
    agent, err = _get_agent_from_token(request)
    if err:
        return err

    data = request.data or {}

    buyer_name = (data.get("buyer_name") or "").strip()
    buyer_email = (data.get("buyer_email") or "").strip()
    address = (data.get("address") or "").strip()

    if not buyer_name or not buyer_email or not address:
        return Response(
            {"error": "buyer_name, buyer_email, and address are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    buyer, _ = Buyer.objects.get_or_create(
        email=buyer_email,
        defaults={"name": buyer_name},
    )
    if buyer.name != buyer_name:
        buyer.name = buyer_name
        buyer.save(update_fields=["name"])

    txn = Transaction.objects.create(
        agent=agent,
        buyer=buyer,
        address=address,
        status=(data.get("status") or "Active"),
        closing_date=data.get("closing_date") or None,
        hero_image_url=(data.get("hero_image_url") or ""),
        homestead_exemption_url=(data.get("homestead_exemption_url") or ""),
        review_url=(data.get("review_url") or ""),
        lofty_transaction_id=(data.get("lofty_transaction_id") or ""),
        my_documents_url=(data.get("my_documents_url") or ""),
    )

    create_defaults = data.get("create_defaults", True)

    if create_defaults:
        Task.objects.bulk_create(
            [
                Task(
                    transaction=txn,
                    title=t["title"],
                    description=t.get("description", ""),
                    order=t.get("order", 0),
                )
                for t in DEFAULT_TASK_TEMPLATES
            ]
        )

        Utility.objects.bulk_create(
            [
                Utility(
                    transaction=txn,
                    category=u["category"],
                    provider_name=u["provider_name"],
                    phone="",
                    website="",
                    account_number_hint="",
                    notes="",
                    due_date=None,
                )
                for u in DEFAULT_UTILITY_TEMPLATES
            ]
        )

    return Response(
        {
            "transaction": {
                "id": txn.id,
                "address": txn.address,
                "status": txn.status,
                "closing_date": txn.closing_date,
                "buyer_name": txn.buyer.name,
                "buyer_email": txn.buyer.email,
            },
            "created_defaults": bool(create_defaults),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def toggle_task(request, task_id):
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response({"error": "task not found"}, status=status.HTTP_404_NOT_FOUND)

    task.completed = not task.completed
    task.save(update_fields=["completed"])
    return Response({"id": task.id, "completed": task.completed})


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def agent_signup(request):
    name = (request.data.get("name") or "").strip()
    email = (request.data.get("email") or "").strip().lower()

    if not name or not email:
        return Response(
            {"error": "name and email are required"}, status=status.HTTP_400_BAD_REQUEST
        )

    agent, created = Agent.objects.get_or_create(
        email=email,
        defaults={"name": name},
    )

    if agent.name != name:
        agent.name = name
        agent.save(update_fields=["name"])

    token = AgentPortalToken.mint(agent, hours=72)
    link = f"http://localhost:5173/agent?t={token.token}"

    return Response(
        {
            "created": bool(created),
            "agent": {"id": agent.id, "name": agent.name, "email": agent.email},
            "token": token.token,
            "expires_at": token.expires_at,
            "link": link,
        },
        status=status.HTTP_201_CREATED,
    )
