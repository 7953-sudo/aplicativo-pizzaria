import { FormEvent, useMemo, useState } from "react"
import { projectId, publicAnonKey } from "../utils/supabase/info"

type AccountRole = "customer" | "admin"

const authUrl = `https://${projectId}.supabase.co/auth/v1`

async function authRequest(
  path: "signup" | "login" | "recover",
  payload: Record<string, string>,
) {
  const endpoint = path === "login" ? "token?grant_type=password" : path
  const body =
    path === "signup"
      ? {
          email: payload.email,
          password: payload.password,
          data: { name: payload.name, role: payload.role },
        }
      : { email: payload.email, password: payload.password }
  const response = await fetch(`${authUrl}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: publicAnonKey,
      Authorization: `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify(body),
  })
  const result = await response.json()
  if (!response.ok) {
    throw new Error(
      result.msg ||
        result.error_description ||
        result.message ||
        "Não foi possível concluir o pedido.",
    )
  }
  return result
}

type Pizza = {
  id: number
  name: string
  description: string
  price: number
  category: "Clássicas" | "Especiais" | "Vegetarianas"
  image: string
  badge?: string
}

type OrderStatus = "Novo" | "Em preparação" | "Saiu para entrega" | "Entregue"

type AdminOrder = {
  id: string
  customer: string
  address: string
  phone: string
  placedAt: string
  total: number
  payment: string
  status: OrderStatus
  items: { name: string; quantity: number; extras?: string[] }[]
}

const initialPizzas: Pizza[] = [
  {
    id: 1,
    name: "Margherita",
    description:
      "Molho da casa, mozzarella fresca, tomate-cereja e manjericão.",
    price: 12.9,
    category: "Clássicas",
    image: "/assets/pizza-margherita.jpg",
    badge: "Mais pedida",
  },
  {
    id: 2,
    name: "Calabresa Dourada",
    description:
      "Calabresa artesanal, cebola roxa, mozzarella e toque de mel picante.",
    price: 15.9,
    category: "Especiais",
    image: "/assets/pizza-calabresa.jpg",
    badge: "Assinatura da casa",
  },
  {
    id: 3,
    name: "Portuguesa",
    description: "Fiambre, ovo, azeitona, cebola, pimento e mozzarella.",
    price: 14.9,
    category: "Clássicas",
    image: "/assets/pizza-portuguesa.jpg",
  },
  {
    id: 4,
    name: "Verde Forno",
    description: "Curgete, cogumelos, pimento, rúcula e pesto de manjericão.",
    price: 14.5,
    category: "Vegetarianas",
    image: "/assets/pizza-vegetariana.jpg",
    badge: "Vegetariana",
  },
]

type ExtraIngredient = {
  name: string
  price: number
}

const initialExtraIngredients: ExtraIngredient[] = [
  { name: "Mozzarella extra", price: 1.5 },
  { name: "Pepperoni", price: 2 },
  { name: "Bacon crocante", price: 2 },
  { name: "Cogumelos", price: 1.5 },
  { name: "Azeitonas", price: 1 },
  { name: "Cebola roxa", price: 1 },
]

const initialOrders: AdminOrder[] = [
  {
    id: "FD-1048",
    customer: "Joana Silva",
    address: "Rua das Flores, 24",
    phone: "+351 912 345 678",
    placedAt: "Hoje, 19:42",
    total: 36.3,
    payment: "Cartão na entrega",
    status: "Novo",
    items: [
      { name: "Calabresa Dourada", quantity: 1, extras: ["Bacon crocante"] },
      { name: "Margherita", quantity: 1 },
    ],
  },
  {
    id: "FD-1047",
    customer: "Miguel Costa",
    address: "Av. da República, 118",
    phone: "+351 934 120 885",
    placedAt: "Hoje, 19:31",
    total: 31.8,
    payment: "Dinheiro",
    status: "Em preparação",
    items: [
      { name: "Portuguesa", quantity: 1, extras: ["Mozzarella extra"] },
      { name: "Verde Forno", quantity: 1 },
    ],
  },
  {
    id: "FD-1046",
    customer: "Inês Martins",
    address: "Travessa do Mercado, 7",
    phone: "+351 961 550 240",
    placedAt: "Hoje, 19:18",
    total: 19.4,
    payment: "Cartão na entrega",
    status: "Saiu para entrega",
    items: [{ name: "Calabresa Dourada", quantity: 1, extras: ["Cogumelos"] }],
  },
]

const formatPrice = (price: number) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(
    price,
  )

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`brand ${compact ? "brand--compact" : ""}`}
      aria-label="Forno d'Oro"
    >
      <span className="brand__mark">F</span>
      <span className="brand__copy">
        <strong>FORNO D'ORO</strong>
        <small>PIZZARIA ARTESANAL</small>
      </span>
    </div>
  )
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "dark"
}

function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button className={`button button--${variant} ${className}`} {...props} />
  )
}

function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
    </label>
  )
}

function Login({ onLogin }: { onLogin: (role: AccountRole) => void }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login")
  const [loginType, setLoginType] = useState<AccountRole>("customer")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setMessage("")
    setLoading(true)

    try {
      if (mode === "forgot") {
        await authRequest("recover", { email })
        setMessage("Enviámos as instruções de recuperação para o seu e-mail.")
        return
      }
      if (mode === "register") {
        const result = await authRequest("signup", {
          name,
          email,
          password,
          role: loginType,
        })
        setPassword("")
        if (result.access_token) {
          onLogin(loginType)
          return
        }
        setMessage(
          "Conta criada, mas o Supabase ainda exige confirmação por e-mail. Desative essa opção nas definições de autenticação.",
        )
        setMode("login")
        return
      }

      const result = await authRequest("login", {
        email,
        password,
      })
      const savedRole = result.user?.user_metadata?.role
      if (savedRole !== loginType) {
        throw new Error(
          loginType === "admin"
            ? "Esta conta não tem acesso à administração."
            : "Esta conta está registada como administrador.",
        )
      }
      onLogin(savedRole)
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível concluir o pedido.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <img
          src="/assets/pizza-hero.jpg"
          alt="Pizza artesanal acabada de sair do forno"
        />
        <div className="login-visual__shade" />
        <div className="login-visual__content">
          <Brand />
          <p className="eyebrow">DESDE 1987 · RECEITAS DE FAMÍLIA</p>
          <p className="hero-title">
            Feita à mão.
            <br />
            Assada com alma.
          </p>
          <p className="hero-copy">
            Massa de fermentação lenta, ingredientes frescos e o calor do nosso
            forno a lenha.
          </p>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="mobile-brand">
            <Brand compact />
          </div>
          <p className="eyebrow eyebrow--red">
            {mode === "login"
              ? "BEM-VINDO DE VOLTA"
              : mode === "register"
                ? "JUNTE-SE À MESA"
                : "RECUPERAR ACESSO"}
          </p>
          <p className="panel-title">
            {mode === "login"
              ? "A sua próxima pizza começa aqui."
              : mode === "register"
                ? "Criar uma conta"
                : "Esqueceu a palavra-passe?"}
          </p>
          <p className="panel-subtitle">
            {mode === "forgot"
              ? "Indique o seu e-mail e enviaremos um link de recuperação."
              : loginType === "admin"
                ? "Acompanhe novos pedidos e mantenha a equipa do forno sincronizada."
                : "Entre para repetir favoritos, acompanhar pedidos e pedir mais rápido."}
          </p>

          {mode !== "forgot" && (
            <div className="login-type" aria-label="Tipo de acesso">
              <Button
                type="button"
                variant="ghost"
                className={loginType === "customer" ? "active" : ""}
                onClick={() => {
                  setLoginType("customer")
                  setEmail("")
                  setPassword("")
                  setMessage("")
                }}
              >
                Cliente
              </Button>
              <Button
                type="button"
                variant="ghost"
                className={loginType === "admin" ? "active" : ""}
                onClick={() => {
                  setLoginType("admin")
                  setEmail("")
                  setPassword("")
                  setMessage("")
                }}
              >
                Administração
              </Button>
            </div>
          )}

          <form onSubmit={submit} className="login-form">
            {mode === "register" && (
              <Field
                label="Nome"
                placeholder="Como devemos chamar-lhe?"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            )}
            <Field
              label="E-mail"
              type="email"
              placeholder="nome@exemplo.pt"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            {mode !== "forgot" && (
              <Field
                label="Palavra-passe"
                type="password"
                placeholder="Mínimo de 8 caracteres"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            )}
            {mode === "login" && (
              <Button
                type="button"
                variant="ghost"
                className="forgot"
                onClick={() => {
                  setMode("forgot")
                  setMessage("")
                }}
              >
                Esqueci a palavra-passe
              </Button>
            )}
            {message && (
              <p className="form-message" role="status">
                {message}
              </p>
            )}
            <Button type="submit" disabled={loading}>
              {loading
                ? "A processar..."
                : mode === "login"
                ? "Entrar e escolher a minha pizza"
                : mode === "register"
                  ? "Criar conta"
                  : "Enviar instruções"}
            </Button>
          </form>

          {mode === "login" ? (
            <p className="switch-copy">
              Ainda não tem conta?{" "}
              <Button
                variant="ghost"
                onClick={() => {
                  setMode("register")
                  setMessage("")
                }}
              >
                Criar conta
              </Button>
            </p>
          ) : (
            <p className="switch-copy">
              Já tem conta?{" "}
              <Button
                variant="ghost"
                onClick={() => {
                  setMode("login")
                  setMessage("")
                }}
              >
                Voltar ao login
              </Button>
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

function Icon({
  name,
}: {
  name: "cart" | "user" | "search" | "pin" | "clock" | "orders" | "flame" | "check"
}) {
  const paths = {
    cart: (
      <>
        <path d="M3 3h2l2.4 10.2a2 2 0 0 0 2 1.5h7.8a2 2 0 0 0 1.9-1.4L21 7H7" />
        <circle cx="10" cy="19" r="1.5" />
        <circle cx="18" cy="19" r="1.5" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    orders: (
      <>
        <path d="M7 3h10v4H7zM5 5H3v16h18V5h-2" />
        <path d="M8 12h8M8 16h5" />
      </>
    ),
    flame: (
      <path d="M13 2s1 4-2 7c-2-2-1-4-1-4s-5 4-5 9a7 7 0 0 0 14 0c0-4-2-7-4-9 0 3-2 4-2 4s1-4 0-7Z" />
    ),
    check: <path d="m5 12 4 4L19 6" />,
  }
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

function Menu({
  onLogout,
  onPlaceOrder,
  pizzas,
  extraIngredients,
  message,
}: {
  onLogout: () => void
  message: string
  onPlaceOrder: (order: AdminOrder) => void
  pizzas: Pizza[]
  extraIngredients: ExtraIngredient[]
}) {
  const [category, setCategory] = useState("Todas")
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<Record<number, number>>({})
  const [cartOpen, setCartOpen] = useState(false)
  const [checkout, setCheckout] = useState(false)
  const [ordered, setOrdered] = useState(false)
  const [customizing, setCustomizing] = useState<Pizza | null>(null)
  const [selectedExtras, setSelectedExtras] =
    useState<Record<number, string[]>>({})
  const [draftExtras, setDraftExtras] = useState<string[]>([])
  const [returnToCart, setReturnToCart] = useState(false)
  const [dismissedMessage, setDismissedMessage] = useState("")

  const filtered = useMemo(
    () =>
      pizzas.filter(
        (pizza) =>
          (category === "Todas" || pizza.category === category) &&
          pizza.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [category, search],
  )
  const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0)
  const subtotal = pizzas.reduce((sum, pizza) => {
    const extrasTotal = (selectedExtras[pizza.id] || []).reduce(
      (total, name) =>
        total +
        (extraIngredients.find((extra) => extra.name === name)?.price || 0),
      0,
    )
    return sum + (pizza.price + extrasTotal) * (cart[pizza.id] || 0)
  }, 0)
  const delivery = subtotal > 0 ? 2.5 : 0

  function placeOrder() {
    onPlaceOrder({
      id: `FD-${1049 + Math.floor(Math.random() * 50)}`,
      customer: "Joana Silva",
      address: "Rua das Flores, 24",
      phone: "+351 912 345 678",
      placedAt: "Agora",
      total: subtotal + delivery,
      payment: "Cartão na entrega",
      status: "Novo",
      items: pizzas
        .filter((pizza) => cart[pizza.id])
        .map((pizza) => ({
          name: pizza.name,
          quantity: cart[pizza.id],
          extras: selectedExtras[pizza.id],
        })),
    })
    setOrdered(true)
    setCartOpen(false)
  }

  function updateCart(id: number, amount: number) {
    setCart((current) => {
      const next = Math.max(0, (current[id] || 0) + amount)
      return { ...current, [id]: next }
    })
  }

  function openCustomizer(pizza: Pizza, fromCart = false) {
    setDraftExtras(selectedExtras[pizza.id] || [])
    setReturnToCart(fromCart)
    setCustomizing(pizza)
  }

  function toggleExtra(name: string) {
    setDraftExtras((current) =>
      current.includes(name)
        ? current.filter((extra) => extra !== name)
        : [...current, name],
    )
  }

  function confirmCustomization() {
    if (!customizing) return
    setSelectedExtras((current) => ({
      ...current,
      [customizing.id]: draftExtras,
    }))
    if (!cart[customizing.id]) updateCart(customizing.id, 1)
    setCustomizing(null)
    if (returnToCart) setCartOpen(true)
    setReturnToCart(false)
  }

  if (ordered) {
    return (
      <main className="success-page">
        <Brand />
        <div className="success-mark">✓</div>
        <p className="eyebrow eyebrow--gold">PEDIDO #FD-1048 CONFIRMADO</p>
        <p className="success-title">O forno já está quente.</p>
        <p>
          O seu pedido chegará em aproximadamente <strong>35–45 minutos</strong>
          .
        </p>
        <Button
          onClick={() => {
            setOrdered(false)
            setCheckout(false)
            setCart({})
          }}
        >
          Voltar ao menu
        </Button>
      </main>
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Brand compact />
        <div className="delivery-location">
          <Icon name="pin" />
          <span>
            <small>Entregar em</small>
            <strong>Rua das Flores, 24</strong>
          </span>
        </div>
        <div className="topbar__actions">
          <Button variant="ghost" className="user-button" onClick={onLogout}>
            <Icon name="user" />
            <span>Sair</span>
          </Button>
          <Button
            variant="dark"
            className="cart-button"
            onClick={() => setCartOpen(true)}
          >
            <Icon name="cart" />
            <span>Cesto</span>
            {count > 0 && <b>{count}</b>}
          </Button>
        </div>
      </header>
      {message && message !== dismissedMessage && (
        <div className="customer-message" role="status">
          <Icon name="flame" />
          <p>
            <small>MENSAGEM DO FORNO D'ORO</small>
            {message}
          </p>
          <Button
            variant="ghost"
            onClick={() => setDismissedMessage(message)}
            aria-label="Fechar mensagem"
          >
            ×
          </Button>
        </div>
      )}

      <main>
        <section className="menu-hero">
          <div>
            <p className="eyebrow eyebrow--gold">HOJE É DIA DE PIZZA</p>
            <p className="menu-title">
              Sabores feitos
              <br />
              para partilhar.
            </p>
            <p>Escolha a sua favorita. Nós tratamos do resto.</p>
          </div>
          <div className="service-note">
            <Icon name="clock" />
            <span>
              <strong>Entrega em 35–45 min</strong>
              <small>Aberto até às 23h</small>
            </span>
          </div>
        </section>

        <section className="menu-content">
          <div className="menu-heading">
            <div>
              <p className="section-title">O nosso menu</p>
              <p>Receitas clássicas e criações da casa.</p>
            </div>
            <label className="search">
              <Icon name="search" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Pesquisar pizza"
              />
            </label>
          </div>
          <div className="category-tabs">
            {["Todas", "Clássicas", "Especiais", "Vegetarianas"].map((item) => (
              <Button
                key={item}
                variant="ghost"
                className={category === item ? "active" : ""}
                onClick={() => setCategory(item)}
              >
                {item}
              </Button>
            ))}
          </div>
          <div className="pizza-grid">
            {filtered.map((pizza) => (
              <article className="pizza-card" key={pizza.id}>
                <div className="pizza-card__image">
                  <img src={pizza.image} alt={`Pizza ${pizza.name}`} />
                  {pizza.badge && <span>{pizza.badge}</span>}
                </div>
                <div className="pizza-card__body">
                  <p className="pizza-name">{pizza.name}</p>
                  <p className="pizza-description">{pizza.description}</p>
                  <div className="pizza-card__footer">
                    <strong>{formatPrice(pizza.price)}</strong>
                    {cart[pizza.id] ? (
                      <div className="stepper">
                        <Button
                          variant="ghost"
                          onClick={() => updateCart(pizza.id, -1)}
                          aria-label={`Retirar ${pizza.name}`}
                        >
                          −
                        </Button>
                        <span>{cart[pizza.id]}</span>
                        <Button
                          variant="ghost"
                          onClick={() => updateCart(pizza.id, 1)}
                          aria-label={`Adicionar ${pizza.name}`}
                        >
                          +
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => openCustomizer(pizza)}
                        aria-label={`Personalizar e adicionar ${pizza.name} ao cesto`}
                      >
                        Personalizar
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="empty-state">
              Não encontrámos nenhuma pizza com esse nome.
            </p>
          )}
        </section>
      </main>

      {customizing && (
        <div
          className="modal-layer"
          role="dialog"
          aria-modal="true"
          aria-label={`Ingredientes extra para ${customizing.name}`}
        >
          <Button
            variant="ghost"
            className="modal-backdrop"
            onClick={() => {
              setCustomizing(null)
              setReturnToCart(false)
            }}
            aria-label="Fechar personalização"
          />
          <section className="customize-modal">
            <div className="drawer-header">
              <div>
                <p className="eyebrow eyebrow--red">PERSONALIZE A SUA PIZZA</p>
                <p className="drawer-title">{customizing.name}</p>
              </div>
              <Button
                variant="ghost"
                className="close"
                onClick={() => {
                  setCustomizing(null)
                  setReturnToCart(false)
                }}
                aria-label="Fechar"
              >
                ×
              </Button>
            </div>
            <div className="customize-intro">
              <span>Ingredientes extra</span>
              <small>Opcional · escolha quantos quiser</small>
            </div>
            <div className="extras-grid">
              {extraIngredients.map((extra, index) => {
                const checked = draftExtras.includes(extra.name)
                return (
                  <label
                    className={`extra-option ${checked ? "selected" : ""}`}
                    key={`${extra.name}-${index}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleExtra(extra.name)}
                    />
                    <span>
                      <strong>{extra.name}</strong>
                      <small>+ {formatPrice(extra.price)}</small>
                    </span>
                    <b>{checked ? "✓" : "+"}</b>
                  </label>
                )
              })}
            </div>
            <div className="customize-footer">
              <div>
                <small>Total desta pizza</small>
                <strong>
                  {formatPrice(
                    customizing.price +
                      draftExtras.reduce(
                        (total, name) =>
                          total +
                          (extraIngredients.find((extra) => extra.name === name)
                            ?.price || 0),
                        0,
                      ),
                  )}
                </strong>
              </div>
              <Button onClick={confirmCustomization}>
                {cart[customizing.id]
                  ? "Guardar alterações"
                  : "Adicionar ao cesto"}
              </Button>
            </div>
          </section>
        </div>
      )}

      {cartOpen && (
        <div
          className="drawer-layer"
          role="dialog"
          aria-modal="true"
          aria-label="O seu cesto"
        >
          <Button
            variant="ghost"
            className="drawer-backdrop"
            onClick={() => setCartOpen(false)}
            aria-label="Fechar cesto"
          />
          <aside className="cart-drawer">
            <div className="drawer-header">
              <div>
                <p className="eyebrow eyebrow--red">O SEU PEDIDO</p>
                <p className="drawer-title">
                  {checkout ? "Finalizar pedido" : "Cesto"}
                </p>
              </div>
              <Button
                variant="ghost"
                className="close"
                onClick={() => {
                  setCartOpen(false)
                  setCheckout(false)
                }}
                aria-label="Fechar"
              >
                ×
              </Button>
            </div>
            {checkout ? (
              <form
                className="checkout-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  placeOrder()
                }}
              >
                <Field label="Nome" defaultValue="Joana Silva" required />
                <Field
                  label="Telefone"
                  defaultValue="+351 912 345 678"
                  required
                />
                <Field
                  label="Morada de entrega"
                  defaultValue="Rua das Flores, 24"
                  required
                />
                <div className="payment-choice">
                  <span>Pagamento</span>
                  <label>
                    <input type="radio" name="payment" defaultChecked /> Cartão
                    na entrega
                  </label>
                  <label>
                    <input type="radio" name="payment" /> Dinheiro
                  </label>
                </div>
                <div className="order-total">
                  <span>Total</span>
                  <strong>{formatPrice(subtotal + delivery)}</strong>
                </div>
                <Button type="submit">Confirmar pedido</Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCheckout(false)}
                >
                  Voltar ao cesto
                </Button>
              </form>
            ) : count === 0 ? (
              <div className="cart-empty">
                <Icon name="cart" />
                <p className="drawer-title">O cesto está vazio</p>
                <p>Adicione uma pizza e ela aparece aqui.</p>
                <Button onClick={() => setCartOpen(false)}>
                  Explorar menu
                </Button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {pizzas
                    .filter((pizza) => cart[pizza.id])
                    .map((pizza) => (
                      <div className="cart-item" key={pizza.id}>
                        <img src={pizza.image} alt="" />
                        <div>
                          <strong>{pizza.name}</strong>
                          <small>
                            {selectedExtras[pizza.id]?.length
                              ? selectedExtras[pizza.id].join(", ")
                              : "Sem ingredientes extra"}
                          </small>
                          <span className="item-unit-price">
                            {formatPrice(
                              pizza.price +
                                (selectedExtras[pizza.id] || []).reduce(
                                  (total, name) =>
                                    total +
                                    (extraIngredients.find(
                                      (extra) => extra.name === name,
                                    )?.price || 0),
                                  0,
                                ),
                            )}
                          </span>
                          <Button
                            variant="ghost"
                            className="edit-extras"
                            onClick={() => {
                              setCartOpen(false)
                              openCustomizer(pizza, true)
                            }}
                          >
                            Editar extras
                          </Button>
                        </div>
                        <div className="stepper">
                          <Button
                            variant="ghost"
                            onClick={() => updateCart(pizza.id, -1)}
                          >
                            −
                          </Button>
                          <span>{cart[pizza.id]}</span>
                          <Button
                            variant="ghost"
                            onClick={() => updateCart(pizza.id, 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="cart-summary">
                  <p>
                    <span>Subtotal</span>
                    <strong>{formatPrice(subtotal)}</strong>
                  </p>
                  <p>
                    <span>Entrega</span>
                    <strong>{formatPrice(delivery)}</strong>
                  </p>
                  <p className="order-total">
                    <span>Total</span>
                    <strong>{formatPrice(subtotal + delivery)}</strong>
                  </p>
                  <Button onClick={() => setCheckout(true)}>
                    Continuar para pagamento
                  </Button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}

type CatalogEditor =
  | { type: "pizza"; item: Pizza; isNew: boolean }
  | { type: "ingredient"; item: ExtraIngredient; originalName: string; isNew: boolean }
  | null

function AdminCatalog({
  pizzas,
  ingredients,
  onSavePizza,
  onDeletePizza,
  onSaveIngredient,
  onDeleteIngredient,
}: {
  pizzas: Pizza[]
  ingredients: ExtraIngredient[]
  onSavePizza: (pizza: Pizza) => void
  onDeletePizza: (id: number) => void
  onSaveIngredient: (ingredient: ExtraIngredient, originalName: string) => void
  onDeleteIngredient: (name: string) => void
}) {
  const [section, setSection] = useState<"pizzas" | "ingredients">("pizzas")
  const [editor, setEditor] = useState<CatalogEditor>(null)

  function newPizza() {
    setEditor({
      type: "pizza",
      isNew: true,
      item: {
        id: Math.max(0, ...pizzas.map((pizza) => pizza.id)) + 1,
        name: "",
        description: "",
        price: 0,
        category: "Clássicas",
        image: "/assets/pizza-margherita.jpg",
      },
    })
  }

  function submitEditor(event: FormEvent) {
    event.preventDefault()
    if (!editor) return
    if (editor.type === "pizza") onSavePizza(editor.item)
    else onSaveIngredient(editor.item, editor.originalName)
    setEditor(null)
  }

  return (
    <section className="catalog-section">
      <div className="catalog-tabs">
        <Button
          variant="ghost"
          className={section === "pizzas" ? "active" : ""}
          onClick={() => setSection("pizzas")}
        >
          Pizzas <b>{pizzas.length}</b>
        </Button>
        <Button
          variant="ghost"
          className={section === "ingredients" ? "active" : ""}
          onClick={() => setSection("ingredients")}
        >
          Ingredientes extra <b>{ingredients.length}</b>
        </Button>
      </div>

      <div className="catalog-toolbar">
        <div>
          <p className="section-title">
            {section === "pizzas" ? "Menu de pizzas" : "Ingredientes extra"}
          </p>
          <p>
            {section === "pizzas"
              ? "Atualize sabores, preços, categorias e imagens."
              : "Controle os extras disponíveis durante a personalização."}
          </p>
        </div>
        <Button
          onClick={() =>
            section === "pizzas"
              ? newPizza()
              : setEditor({
                  type: "ingredient",
                  isNew: true,
                  originalName: "",
                  item: { name: "", price: 0 },
                })
          }
        >
          + {section === "pizzas" ? "Nova pizza" : "Novo ingrediente"}
        </Button>
      </div>

      {section === "pizzas" ? (
        <div className="catalog-grid">
          {pizzas.map((pizza) => (
            <article className="catalog-pizza" key={pizza.id}>
              <img src={pizza.image} alt="" />
              <div>
                <span>{pizza.category}</span>
                <strong>{pizza.name}</strong>
                <p>{pizza.description}</p>
                <b>{formatPrice(pizza.price)}</b>
              </div>
              <div className="catalog-actions">
                <Button
                  variant="ghost"
                  onClick={() =>
                    setEditor({ type: "pizza", item: { ...pizza }, isNew: false })
                  }
                >
                  Editar
                </Button>
                <Button variant="ghost" onClick={() => onDeletePizza(pizza.id)}>
                  Remover
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="ingredients-table">
          <div className="ingredients-row ingredients-row--heading">
            <span>Ingrediente</span>
            <span>Preço adicional</span>
            <span>Ações</span>
          </div>
          {ingredients.map((ingredient, index) => (
            <div
              className="ingredients-row"
              key={`${ingredient.name}-${index}`}
            >
              <span className="ingredient-name">
                <b>{ingredient.name.charAt(0)}</b>
                <strong>{ingredient.name}</strong>
              </span>
              <strong>{formatPrice(ingredient.price)}</strong>
              <span className="catalog-actions">
                <Button
                  variant="ghost"
                  onClick={() =>
                    setEditor({
                      type: "ingredient",
                      item: { ...ingredient },
                      originalName: ingredient.name,
                      isNew: false,
                    })
                  }
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => onDeleteIngredient(ingredient.name)}
                >
                  Remover
                </Button>
              </span>
            </div>
          ))}
        </div>
      )}

      {editor && (
        <div
          className="modal-layer"
          role="dialog"
          aria-modal="true"
          aria-label={
            editor.type === "pizza" ? "Editar pizza" : "Editar ingrediente"
          }
        >
          <Button
            variant="ghost"
            className="modal-backdrop"
            onClick={() => setEditor(null)}
            aria-label="Fechar edição"
          />
          <form className="catalog-modal" onSubmit={submitEditor}>
            <div className="drawer-header">
              <div>
                <p className="eyebrow eyebrow--red">ATUALIZAR MENU</p>
                <p className="drawer-title">
                  {editor.isNew ? "Adicionar" : "Editar"}{" "}
                  {editor.type === "pizza" ? "pizza" : "ingrediente"}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="close"
                onClick={() => setEditor(null)}
                aria-label="Fechar"
              >
                ×
              </Button>
            </div>

            {editor.type === "pizza" ? (
              <>
                <Field
                  label="Nome da pizza"
                  value={editor.item.name}
                  onChange={(event) =>
                    setEditor({
                      ...editor,
                      item: { ...editor.item, name: event.target.value },
                    })
                  }
                  required
                />
                <Field
                  label="Descrição"
                  value={editor.item.description}
                  onChange={(event) =>
                    setEditor({
                      ...editor,
                      item: { ...editor.item, description: event.target.value },
                    })
                  }
                  required
                />
                <div className="editor-row">
                  <Field
                    label="Preço (€)"
                    type="number"
                    min="0"
                    step="0.1"
                    value={editor.item.price}
                    onChange={(event) =>
                      setEditor({
                        ...editor,
                        item: {
                          ...editor.item,
                          price: Number(event.target.value),
                        },
                      })
                    }
                    required
                  />
                  <Field
                    label="Destaque opcional"
                    value={editor.item.badge || ""}
                    placeholder="Ex.: Mais pedida"
                    onChange={(event) =>
                      setEditor({
                        ...editor,
                        item: {
                          ...editor.item,
                          badge: event.target.value || undefined,
                        },
                      })
                    }
                  />
                </div>
                <Field
                  label="Caminho da imagem"
                  value={editor.item.image}
                  onChange={(event) =>
                    setEditor({
                      ...editor,
                      item: { ...editor.item, image: event.target.value },
                    })
                  }
                  required
                />
                <div className="category-editor">
                  <span>Categoria</span>
                  <div>
                    {(["Clássicas", "Especiais", "Vegetarianas"] as const).map(
                      (category) => (
                        <Button
                          type="button"
                          variant="ghost"
                          className={
                            editor.item.category === category ? "active" : ""
                          }
                          onClick={() =>
                            setEditor({
                              ...editor,
                              item: { ...editor.item, category },
                            })
                          }
                          key={category}
                        >
                          {category}
                        </Button>
                      ),
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="editor-row">
                <Field
                  label="Nome do ingrediente"
                  value={editor.item.name}
                  onChange={(event) =>
                    setEditor({
                      ...editor,
                      item: { ...editor.item, name: event.target.value },
                    })
                  }
                  required
                />
                <Field
                  label="Preço adicional (€)"
                  type="number"
                  min="0"
                  step="0.1"
                  value={editor.item.price}
                  onChange={(event) =>
                    setEditor({
                      ...editor,
                      item: {
                        ...editor.item,
                        price: Number(event.target.value),
                      },
                    })
                  }
                  required
                />
              </div>
            )}
            <div className="catalog-modal__actions">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditor(null)}
              >
                Cancelar
              </Button>
              <Button type="submit">Guardar alterações</Button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}

const statusSteps: OrderStatus[] = [
  "Novo",
  "Em preparação",
  "Saiu para entrega",
  "Entregue",
]

function AdminDashboard({
  orders,
  pizzas,
  ingredients,
  onUpdateStatus,
  onSavePizza,
  onDeletePizza,
  onSaveIngredient,
  onDeleteIngredient,
  onLogout,
  onSendMessage,
}: {
  onSendMessage: (message: string) => void
  orders: AdminOrder[]
  pizzas: Pizza[]
  ingredients: ExtraIngredient[]
  onUpdateStatus: (id: string, status: OrderStatus) => void
  onSavePizza: (pizza: Pizza) => void
  onDeletePizza: (id: number) => void
  onSaveIngredient: (ingredient: ExtraIngredient, originalName: string) => void
  onDeleteIngredient: (name: string) => void
  onLogout: () => void
}) {
  const [view, setView] = useState<"orders" | "catalog" | "message">("orders")
  const [draft, setDraft] = useState("")
  const [sent, setSent] = useState(false)
  const [filter, setFilter] = useState<"Ativos" | OrderStatus>("Ativos")
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const activeOrders = orders.filter((order) => order.status !== "Entregue")
  const visibleOrders =
    filter === "Ativos"
      ? activeOrders
      : orders.filter((order) => order.status === filter)
  const revenue = orders.reduce((sum, order) => sum + order.total, 0)

  function advanceOrder(order: AdminOrder) {
    const nextStatus = statusSteps[statusSteps.indexOf(order.status) + 1]
    if (nextStatus) {
      onUpdateStatus(order.id, nextStatus)
      setSelectedOrder((current) =>
        current?.id === order.id ? { ...current, status: nextStatus } : current,
      )
    }
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Brand />
        <div className="admin-nav">
          <Button
            variant="ghost"
            className={view === "orders" ? "active" : ""}
            onClick={() => setView("orders")}
          >
            <Icon name="orders" />
            <span>Pedidos</span>
            <b>{activeOrders.length}</b>
          </Button>
          <Button
            variant="ghost"
            className={view === "catalog" ? "active" : ""}
            onClick={() => setView("catalog")}
          >
            <Icon name="flame" />
            <span>Menu e ingredientes</span>
          </Button>
          <Button
            variant="ghost"
            className={view === "message" ? "active" : ""}
            onClick={() => setView("message")}
          >
            <Icon name="user" />
            <span>Mensagem</span>
          </Button>
        </div>
        <div className="admin-profile">
          <span className="admin-avatar">AD</span>
          <span>
            <strong>Administração</strong>
            <small>Forno d'Oro</small>
          </span>
          <Button
            variant="ghost"
            onClick={onLogout}
            aria-label="Terminar sessão"
          >
            Sair
          </Button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-mobile-header">
          <Brand compact />
          <div>
            <Button
              variant="ghost"
              onClick={() =>
                setView((current) =>
                  current === "orders"
                    ? "catalog"
                    : current === "catalog"
                      ? "message"
                      : "orders",
                )
              }
            >
              {view === "orders"
                ? "Editar menu"
                : view === "catalog"
                  ? "Mensagem"
                  : "Ver pedidos"}
            </Button>
            <Button variant="ghost" onClick={onLogout}>
              Sair
            </Button>
          </div>
        </header>
        <div className="admin-heading">
          <div>
            <p className="eyebrow eyebrow--red">CENTRAL DE OPERAÇÕES</p>
            <p className="admin-title">
              {view === "orders"
                ? "Pedidos"
                : view === "catalog"
                  ? "Menu e ingredientes"
                  : "Mensagem"}
            </p>
            <p>
              {view === "orders"
                ? "Acompanhe a cozinha e mantenha cada entrega em movimento."
                : view === "catalog"
                  ? "Mantenha a oferta, preços e extras sempre atualizados."
                  : "Escreva uma mensagem que os clientes veem no menu."}
            </p>
          </div>
          {view === "orders" && (
            <div className="live-indicator">
              <span /> Atualização em tempo real
            </div>
          )}
        </div>

        {view === "orders" ? (
          <>
            <section className="admin-stats" aria-label="Resumo de hoje">
          <article>
            <span className="stat-icon stat-icon--red">
              <Icon name="orders" />
            </span>
            <span>
              <small>Pedidos ativos</small>
              <strong>{activeOrders.length}</strong>
            </span>
          </article>
          <article>
            <span className="stat-icon stat-icon--gold">
              <Icon name="flame" />
            </span>
            <span>
              <small>Em preparação</small>
              <strong>
                {
                  orders.filter((order) => order.status === "Em preparação")
                    .length
                }
              </strong>
            </span>
          </article>
          <article>
            <span className="stat-icon stat-icon--green">
              <Icon name="check" />
            </span>
            <span>
              <small>Vendas de hoje</small>
              <strong>{formatPrice(revenue)}</strong>
            </span>
          </article>
            </section>

            <section className="orders-section">
          <div className="orders-toolbar">
            <div>
              <p className="section-title">Fila de pedidos</p>
              <p>
                {visibleOrders.length}{" "}
                {visibleOrders.length === 1 ? "pedido" : "pedidos"} nesta vista
              </p>
            </div>
            <div className="order-filters">
              {([
                "Ativos",
                "Novo",
                "Em preparação",
                "Saiu para entrega",
                "Entregue",
              ] as const).map((item) => (
                <Button
                  key={item}
                  variant="ghost"
                  className={filter === item ? "active" : ""}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>

          <div className="orders-list">
            {visibleOrders.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="order-card__top">
                  <div>
                    <span
                      className={`status-pill status-${statusSteps.indexOf(order.status)}`}
                    >
                      {order.status}
                    </span>
                    <strong>#{order.id}</strong>
                  </div>
                  <time>{order.placedAt}</time>
                </div>
                <div className="order-card__customer">
                  <span className="customer-initial">
                    {order.customer.charAt(0)}
                  </span>
                  <span>
                    <strong>{order.customer}</strong>
                    <small>{order.address}</small>
                  </span>
                </div>
                <div className="order-items-preview">
                  {order.items.map((item) => (
                    <p key={item.name}>
                      <b>{item.quantity}×</b>
                      <span>{item.name}</span>
                    </p>
                  ))}
                </div>
                <div className="order-card__footer">
                  <strong>{formatPrice(order.total)}</strong>
                  <div>
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedOrder(order)}
                    >
                      Ver detalhes
                    </Button>
                    {order.status !== "Entregue" && (
                      <Button onClick={() => advanceOrder(order)}>
                        {order.status === "Novo"
                          ? "Aceitar pedido"
                          : order.status === "Em preparação"
                            ? "Pronto para entrega"
                            : "Marcar entregue"}
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            ))}
            {visibleOrders.length === 0 && (
              <div className="orders-empty">
                <Icon name="check" />
                <strong>Tudo em dia</strong>
                <span>Não existem pedidos com este estado.</span>
              </div>
            )}
          </div>
            </section>
          </>
        ) : view === "message" ? (
          <form
            className="message-form"
            onSubmit={(event) => {
              event.preventDefault()
              if (!draft.trim()) return
              onSendMessage(draft.trim())
              setDraft("")
              setSent(true)
            }}
          >
            <label className="field">
              Mensagem para o cliente
              <textarea
                value={draft}
                maxLength={280}
                rows={5}
                placeholder="Ex.: Hoje o tempo de entrega pode demorar mais 15 minutos."
                onChange={(event) => {
                  setDraft(event.target.value)
                  setSent(false)
                }}
              />
            </label>
            <div>
              {sent && <span className="message-sent">Mensagem enviada</span>}
              <Button type="submit" disabled={!draft.trim()}>
                Enviar mensagem
              </Button>
            </div>
          </form>
        ) : (
          <AdminCatalog
            pizzas={pizzas}
            ingredients={ingredients}
            onSavePizza={onSavePizza}
            onDeletePizza={onDeletePizza}
            onSaveIngredient={onSaveIngredient}
            onDeleteIngredient={onDeleteIngredient}
          />
        )}
      </main>

      {selectedOrder && (
        <div
          className="drawer-layer"
          role="dialog"
          aria-modal="true"
          aria-label={`Detalhes do pedido ${selectedOrder.id}`}
        >
          <Button
            variant="ghost"
            className="drawer-backdrop"
            onClick={() => setSelectedOrder(null)}
            aria-label="Fechar detalhes"
          />
          <aside className="order-detail">
            <div className="drawer-header">
              <div>
                <p className="eyebrow eyebrow--red">DETALHES DO PEDIDO</p>
                <p className="drawer-title">#{selectedOrder.id}</p>
              </div>
              <Button
                variant="ghost"
                className="close"
                onClick={() => setSelectedOrder(null)}
                aria-label="Fechar"
              >
                ×
              </Button>
            </div>
            <div className="status-progress">
              {statusSteps.map((status, index) => (
                <div
                  className={
                    index <= statusSteps.indexOf(selectedOrder.status)
                      ? "complete"
                      : ""
                  }
                  key={status}
                >
                  <span>
                    {index < statusSteps.indexOf(selectedOrder.status)
                      ? "✓"
                      : index + 1}
                  </span>
                  <small>{status}</small>
                </div>
              ))}
            </div>
            <section className="detail-block">
              <span>Cliente e entrega</span>
              <strong>{selectedOrder.customer}</strong>
              <p>
                {selectedOrder.phone}
                <br />
                {selectedOrder.address}
              </p>
            </section>
            <section className="detail-block">
              <span>Itens do pedido</span>
              {selectedOrder.items.map((item) => (
                <div className="detail-item" key={item.name}>
                  <b>{item.quantity}×</b>
                  <p>
                    <strong>{item.name}</strong>
                    <small>
                      {item.extras?.length
                        ? `Extras: ${item.extras.join(", ")}`
                        : "Sem ingredientes extra"}
                    </small>
                  </p>
                </div>
              ))}
            </section>
            <section className="detail-total">
              <span>
                <small>Pagamento</small>
                <strong>{selectedOrder.payment}</strong>
              </span>
              <span>
                <small>Total</small>
                <strong>{formatPrice(selectedOrder.total)}</strong>
              </span>
            </section>
            {selectedOrder.status !== "Entregue" && (
              <Button
                className="detail-action"
                onClick={() => advanceOrder(selectedOrder)}
              >
                {selectedOrder.status === "Novo"
                  ? "Aceitar e preparar pedido"
                  : selectedOrder.status === "Em preparação"
                    ? "Enviar para entrega"
                    : "Marcar como entregue"}
              </Button>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [role, setRole] = useState<"customer" | "admin" | null>(null)
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders)
  const [pizzas, setPizzas] = useState<Pizza[]>(initialPizzas)
  const [ingredients, setIngredients] = useState<ExtraIngredient[]>(
    initialExtraIngredients,
  )
  const [customerMessage, setCustomerMessage] = useState("")

  function updateOrderStatus(id: string, status: OrderStatus) {
    setOrders((current) =>
      current.map((order) => (order.id === id ? { ...order, status } : order)),
    )
  }

  function savePizza(updatedPizza: Pizza) {
    setPizzas((current) => {
      const exists = current.some((pizza) => pizza.id === updatedPizza.id)
      return exists
        ? current.map((pizza) =>
            pizza.id === updatedPizza.id ? updatedPizza : pizza,
          )
        : [...current, updatedPizza]
    })
  }

  function saveIngredient(
    updatedIngredient: ExtraIngredient,
    originalName: string,
  ) {
    setIngredients((current) => {
      const targetIndex = current.findIndex(
        (ingredient) =>
          ingredient.name === originalName ||
          ingredient.name === updatedIngredient.name,
      )
      if (targetIndex === -1) return [...current, updatedIngredient]

      return current.flatMap((ingredient, index) => {
        if (index === targetIndex) return [updatedIngredient]
        return ingredient.name === updatedIngredient.name ? [] : [ingredient]
      })
    })
  }

  if (role === "admin") {
    return (
      <AdminDashboard
        orders={orders}
        pizzas={pizzas}
        ingredients={ingredients}
        onUpdateStatus={updateOrderStatus}
        onSavePizza={savePizza}
        onDeletePizza={(id) =>
          setPizzas((current) => current.filter((pizza) => pizza.id !== id))
        }
        onSaveIngredient={saveIngredient}
        onDeleteIngredient={(name) =>
          setIngredients((current) =>
            current.filter((ingredient) => ingredient.name !== name),
          )
        }
        onLogout={() => setRole(null)}
        onSendMessage={setCustomerMessage}
      />
    )
  }
  if (role === "customer") {
    return (
      <Menu
        pizzas={pizzas}
        extraIngredients={ingredients}
        message={customerMessage}
        onLogout={() => setRole(null)}
        onPlaceOrder={(order) => setOrders((current) => [order, ...current])}
      />
    )
  }
  return <Login onLogin={setRole} />
}
