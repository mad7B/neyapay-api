footer>© 2025 Neyapay.com.tr | Made with AI</footer>
<div id="darkToggle" onclick="toggleDark()">Ay</div>

<script>
/* ====== CONFIG ====== */
const proxyUrl = "https://neyapay-api.vercel.app/api/zap";

/* Daily limit tracking (client-side) */
let dailyLimit = 500;
let used = parseInt(localStorage.getItem('neyapay_used')||'0');
const today = new Date().toDateStr
