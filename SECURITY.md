# Security policy

Thanks for helping keep OpenTrustEngine and its users safe.

## Reporting a vulnerability

**Please do not file a public issue for security problems.**

Use one of the private channels below:

- 🔒 **GitHub Security Advisory** — preferred, end-to-end encrypted with maintainers:
  <https://github.com/deepakfq/opentrustengine/security/advisories/new>
- 📧 **Email** — `security@opentrustengine.com` or `deepak@freaquer.com`
  Include `[SECURITY]` in the subject line.

Please include:
1. A clear description of the issue and the affected component (`@ote/sdk` / `@ote/widget` / connector / hosted API)
2. Reproduction steps or proof-of-concept
3. The version(s) you tested
4. Your assessment of the impact (data exposure, score manipulation, denial of service, etc.)

## Our commitment

| Stage | SLA |
|---|---|
| Acknowledgement | Within **48 hours** |
| Initial triage  | Within **5 business days** |
| Fix or mitigation | Within **30 days** for critical / high severity |
| Coordinated disclosure | After fix is shipped, with credit (unless you prefer anonymity) |

## Scope

| In scope | Out of scope |
|---|---|
| Public hosted APIs at `api.opentrustengine.com`, `api.onetrustengine.com`, `verify.onetrustengine.com` | Third-party connector misconfiguration (your Razorpay/Cashfree credentials are your responsibility) |
| Published npm packages `@ote/*` | Forks or modified self-hosted deployments not following our docs |
| TrustSign signature forgery / verification bypass | Issues in upstream dependencies (please report to those projects) |
| Authentication / authorisation flaws | Social engineering, physical attacks, denial-of-service via volumetric flooding |
| Score manipulation via undocumented vectors | Issues already covered by the [public roadmap](README.md#-roadmap) (e.g. WTS not yet implemented) |

## Bounty programme

A formal bug-bounty programme is planned. Until it is announced, we acknowledge serious reports publicly (with permission) and offer a **token gift** (₹5,000–₹50,000 depending on severity) for valid critical findings.

## PGP key

PGP support is planned for the `security@opentrustengine.com` address. Until then, please use the GitHub Security Advisory channel for sensitive details.

---

**Maintainer**: Deepak Kumar Dwivedi, Freaquer.
