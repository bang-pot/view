import Link from "next/link";

import { Button } from "@/shared/ui/Button";
import { TextButton } from "@/shared/ui/TextButton";

type UiPlaygroundPageProps = {
  searchParams?:
    | {
        tab?: string;
      }
    | Promise<{
        tab?: string;
      }>;
};

type TabKey = "button" | "text-button";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "button", label: "Button" },
  { key: "text-button", label: "Text Button" },
];

const buttonVariants = [
  { label: "primary", variant: "primary" as const },
  { label: "secondary", variant: "secondary" as const },
  { label: "ghost", variant: "ghost" as const },
];

const buttonSizes = [
  { label: "sm", size: "sm" as const },
  { label: "md", size: "md" as const },
  { label: "lg", size: "lg" as const },
];

const visualStates = [
  { label: "default", visualState: "default" as const },
  { label: "hover", visualState: "hover" as const },
  { label: "pressed", visualState: "pressed" as const },
  { label: "disabled", visualState: "disabled" as const },
];

const buttonTextStyles = [
  { label: "sm", font: "Pretendard 13px", weight: "Semi Bold" },
  { label: "md", font: "Pretendard 14px", weight: "Semi Bold" },
  { label: "lg", font: "Pretendard 16px", weight: "Semi Bold" },
];

const buttonTokens = [
  { name: "button/primaryText", value: "#ffffff" },
  { name: "button/primaryBg", value: "#111111" },
  { name: "button/primaryHover", value: "#262626" },
  { name: "button/primaryPressed", value: "#404040" },
  { name: "button/disabledText", value: "#a3a3a3" },
  { name: "button/disabledBg", value: "#e5e5e5" },
  { name: "button/secondaryText", value: "#ffffff" },
  { name: "button/secondaryBg", value: "#449bfe" },
  { name: "button/secondaryHover", value: "#3d8ee5" },
  { name: "button/secondaryPressed", value: "#357fcc" },
  { name: "button/ghostText", value: "#111111" },
  { name: "button/ghostBorder", value: "#d4d4d4" },
  { name: "button/ghostHover", value: "#f2f2f2" },
  { name: "button/ghostPressed", value: "#e5e5e5" },
];

function resolveActiveTab(tab?: string): TabKey {
  return tab === "text-button" ? tab : "button";
}

function DotIcon() {
  return (
    <span
      aria-hidden="true"
      style={{
        background: "currentColor",
        borderRadius: 999,
        display: "inline-block",
        height: 10,
        width: 10,
      }}
    />
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 20, marginBottom: 12, marginTop: 32 }}>{children}</h2>;
}

function Panel({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section
      aria-label={title}
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        marginBottom: 16,
        padding: 16,
      }}
    >
      <h3 style={{ fontSize: 16, marginBottom: 12, marginTop: 0 }}>{title}</h3>
      {children}
    </section>
  );
}

function ButtonTabContent() {
  return (
    <>
      <SectionTitle>Button</SectionTitle>

      <Panel title="Applied preview">
        <div
          style={{
            alignItems: "center",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "space-between",
            padding: 16,
          }}
        >
          <div>
            <p style={{ fontWeight: 600, margin: "0 0 8px" }}>Action group sample</p>
            <p style={{ color: "#525252", margin: 0 }}>
              This preview stays inside the playground. Product screens are unchanged.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Button size="md" variant="ghost">
              Cancel
            </Button>
            <Button size="md" variant="secondary">
              Save draft
            </Button>
            <Button size="md" variant="primary">
              Save
            </Button>
          </div>
        </div>
      </Panel>

      <Panel title="Variant x Size">
        <div style={{ display: "grid", gap: 20 }}>
          {buttonVariants.map((variant) => (
            <div key={variant.variant}>
              <p style={{ fontWeight: 600, marginBottom: 8, marginTop: 0 }}>{variant.label}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {buttonSizes.map((size) => (
                  <Button key={`${variant.variant}-${size.size}`} size={size.size} variant={variant.variant}>
                    Button
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="State preview">
        <div style={{ display: "grid", gap: 20 }}>
          {buttonVariants.map((variant) => (
            <div key={`state-${variant.variant}`}>
              <p style={{ fontWeight: 600, marginBottom: 8, marginTop: 0 }}>{variant.label}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {visualStates.map((state) => (
                  <Button
                    key={`${variant.variant}-${state.visualState}`}
                    variant={variant.variant}
                    visualState={state.visualState}
                  >
                    {state.label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Icon combinations">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Button leftIcon={<DotIcon />} size="sm">
            Left icon
          </Button>
          <Button rightIcon={<DotIcon />} size="sm">
            Right icon
          </Button>
          <Button leftIcon={<DotIcon />} rightIcon={<DotIcon />} size="md" variant="secondary">
            Both icons
          </Button>
          <Button leftIcon={<DotIcon />} size="md" variant="ghost" disabled>
            Disabled icon
          </Button>
        </div>
      </Panel>

      <Panel title="Figma text styles">
        <div style={{ display: "grid", gap: 12 }}>
          <p style={{ color: "#525252", margin: 0 }}>
            Source node: <code>27:614</code>
          </p>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th align="left">Size</th>
                <th align="left">Font</th>
                <th align="left">Weight</th>
              </tr>
            </thead>
            <tbody>
              {buttonTextStyles.map((style) => (
                <tr key={style.label}>
                  <td style={{ padding: "8px 0" }}>{style.label}</td>
                  <td style={{ padding: "8px 0" }}>{style.font}</td>
                  <td style={{ padding: "8px 0" }}>{style.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Figma tokens">
        <div
          style={{
            display: "grid",
            gap: 8,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {buttonTokens.map((token) => (
            <div
              key={token.name}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <p style={{ fontWeight: 600, margin: "0 0 6px" }}>{token.name}</p>
              <p style={{ color: "#525252", margin: 0 }}>{token.value}</p>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}

function TextButtonTabContent() {
  return (
    <>
      <SectionTitle>Text Button</SectionTitle>

      <Panel title="Applied preview">
        <div
          style={{
            alignItems: "center",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "space-between",
            padding: 16,
          }}
        >
          <div>
            <p style={{ fontWeight: 600, margin: "0 0 8px" }}>Inline action sample</p>
            <p style={{ color: "#525252", margin: 0 }}>
              Lightweight text action for secondary flows inside cards, rows, and helper areas.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <TextButton size="sm" variant="primary">
              View details
            </TextButton>
            <TextButton size="md" variant="assist">
              Open helper
            </TextButton>
          </div>
        </div>
      </Panel>

      <Panel title="Variant x Size">
        <div style={{ display: "grid", gap: 20 }}>
          {[
            { label: "primary", variant: "primary" as const },
            { label: "assist", variant: "assist" as const },
          ].map((variant) => (
            <div key={variant.variant}>
              <p style={{ fontWeight: 600, marginBottom: 8, marginTop: 0 }}>{variant.label}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {[
                  { label: "sm", size: "sm" as const },
                  { label: "md", size: "md" as const },
                ].map((size) => (
                  <TextButton key={`${variant.variant}-${size.size}`} size={size.size} variant={variant.variant}>
                    Text button
                  </TextButton>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Type preview">
        <div style={{ display: "grid", gap: 20 }}>
          {[
            { label: "text-only", leftIcon: null, rightIcon: null },
            { label: "icon-left", leftIcon: <DotIcon />, rightIcon: null },
            { label: "icon-right", leftIcon: null, rightIcon: <DotIcon /> },
          ].map((preview) => (
            <div key={preview.label}>
              <p style={{ fontWeight: 600, marginBottom: 8, marginTop: 0 }}>{preview.label}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <TextButton leftIcon={preview.leftIcon} rightIcon={preview.rightIcon} size="sm">
                  Default
                </TextButton>
                <TextButton
                  disabled
                  leftIcon={preview.leftIcon}
                  rightIcon={preview.rightIcon}
                  size="md"
                  variant="assist"
                >
                  Disabled
                </TextButton>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Figma text styles">
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th align="left">Size</th>
              <th align="left">Font</th>
              <th align="left">Weight</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px 0" }}>sm</td>
              <td style={{ padding: "8px 0" }}>Pretendard 13px</td>
              <td style={{ padding: "8px 0" }}>Medium</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 0" }}>md</td>
              <td style={{ padding: "8px 0" }}>Pretendard 14px</td>
              <td style={{ padding: "8px 0" }}>Medium</td>
            </tr>
          </tbody>
        </table>
      </Panel>
    </>
  );
}

export default async function UiPlaygroundPage({ searchParams }: UiPlaygroundPageProps) {
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : undefined;
  const activeTab = resolveActiveTab(resolvedSearchParams?.tab);

  return (
    <main
      style={{
        background: "#fafafa",
        minHeight: "100vh",
        padding: 24,
      }}
    >
      <h1>UI Playground</h1>
      <p>URL-only preview space for shared components.</p>
      <p>Current route: /playground/ui</p>

      <nav aria-label="Component tabs" style={{ marginTop: 24 }}>
        <ul
          style={{
            display: "flex",
            gap: 12,
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <li key={tab.key}>
                <Link
                  aria-current={isActive ? "page" : undefined}
                  href={`/playground/ui?tab=${tab.key}`}
                  style={{
                    background: isActive ? "#111111" : "#ffffff",
                    border: "1px solid #d4d4d4",
                    borderRadius: 999,
                    color: isActive ? "#ffffff" : "#111111",
                    display: "inline-flex",
                    padding: "10px 16px",
                    textDecoration: "none",
                  }}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {activeTab === "button" ? <ButtonTabContent /> : null}
      {activeTab === "text-button" ? <TextButtonTabContent /> : null}
    </main>
  );
}
