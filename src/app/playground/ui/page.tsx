import { Fragment } from "react";
import Link from "next/link";

import { Button } from "@/shared/ui/Button";
import { Chip } from "@/shared/ui/Chip";
import { IconButton } from "@/shared/ui/IconButton";
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

type TabKey = "button" | "text-button" | "icon-button" | "chip";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "button", label: "Button" },
  { key: "text-button", label: "Text Button" },
  { key: "icon-button", label: "Icon Button" },
  { key: "chip", label: "Chip" },
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
  return tab === "text-button" || tab === "icon-button" || tab === "chip" ? tab : "button";
}

function SquareIcon({ color = "currentColor" }: { color?: string }) {
  return (
    <span
      aria-hidden="true"
      style={{
        background: color,
        borderRadius: 2,
        display: "inline-block",
        height: 12,
        width: 12,
      }}
    />
  );
}

const iconButtonTextStyles = [
  { label: "아이콘", font: "Text style 없음", weight: "아이콘 전용 컴포넌트" },
];

const chipTextStyles = [
  { label: "lg", font: "Pretendard 14px", weight: "Medium" },
  { label: "md", font: "Pretendard 13px", weight: "Medium" },
  { label: "sm", font: "Pretendard 12px", weight: "Medium" },
];

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
  const buttonRows = [
    { label: "primary / Text only", variant: "primary" as const, leftIcon: null, rightIcon: null },
    { label: "primary / Icon left", variant: "primary" as const, leftIcon: <SquareIcon color="#ffffff" />, rightIcon: null },
    { label: "primary / Icon right", variant: "primary" as const, leftIcon: null, rightIcon: <SquareIcon color="#ffffff" /> },
    { label: "secondary / Text only", variant: "secondary" as const, leftIcon: null, rightIcon: null },
    { label: "secondary / Icon left", variant: "secondary" as const, leftIcon: <SquareIcon color="#ffffff" />, rightIcon: null },
    { label: "secondary / Icon right", variant: "secondary" as const, leftIcon: null, rightIcon: <SquareIcon color="#ffffff" /> },
    { label: "ghost / Text only", variant: "ghost" as const, leftIcon: null, rightIcon: null },
    { label: "ghost / Icon left", variant: "ghost" as const, leftIcon: <SquareIcon />, rightIcon: null },
    { label: "ghost / Icon right", variant: "ghost" as const, leftIcon: null, rightIcon: <SquareIcon /> },
  ];

  function renderMatrix(size: "sm" | "md" | "lg", heading: string) {
    return (
      <Panel title={heading}>
        <div
          style={{
            alignItems: "start",
            columnGap: 20,
            display: "grid",
            gridTemplateColumns: "180px 1fr 1fr 1fr 1fr",
            rowGap: 14,
          }}
        >
          <div />
          <p style={{ color: "#a3a3a3", fontSize: 13, margin: 0 }}>Default</p>
          <p style={{ color: "#a3a3a3", fontSize: 13, margin: 0 }}>Hover</p>
          <p style={{ color: "#a3a3a3", fontSize: 13, margin: 0 }}>Pressed</p>
          <p style={{ color: "#a3a3a3", fontSize: 13, margin: 0 }}>Disabled</p>
          {buttonRows.map((row) => (
            <Fragment key={`${heading}-${row.label}`}>
              <p style={{ color: "#737373", fontSize: 13, margin: 0 }}>{row.label}</p>
              <Button
                leftIcon={row.leftIcon}
                rightIcon={row.rightIcon}
                size={size}
                variant={row.variant}
              >
                Button
              </Button>
              <Button
                leftIcon={row.leftIcon}
                rightIcon={row.rightIcon}
                size={size}
                variant={row.variant}
                visualState="hover"
              >
                Button
              </Button>
              <Button
                leftIcon={row.leftIcon}
                rightIcon={row.rightIcon}
                size={size}
                variant={row.variant}
                visualState="pressed"
              >
                Button
              </Button>
              <Button
                disabled
                leftIcon={
                  row.leftIcon ? (
                    <SquareIcon color="#a3a3a3" />
                  ) : null
                }
                rightIcon={
                  row.rightIcon ? (
                    <SquareIcon color="#a3a3a3" />
                  ) : null
                }
                size={size}
                variant={row.variant}
              >
                Button
              </Button>
            </Fragment>
          ))}
        </div>
      </Panel>
    );
  }

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
              Token-based button styles arranged to match the screenshot matrix for visual verification.
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

      {renderMatrix("sm", "Small · 32px")}
      {renderMatrix("md", "Medium · 40px")}
      {renderMatrix("lg", "Large · 48px")}

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
  const textButtonRows = [
    { label: "primary / Text only", variant: "primary" as const, leftIcon: null, rightIcon: null },
    { label: "primary / Icon left", variant: "primary" as const, leftIcon: <SquareIcon />, rightIcon: null },
    { label: "primary / Icon right", variant: "primary" as const, leftIcon: null, rightIcon: <SquareIcon /> },
    { label: "assist / Text only", variant: "assist" as const, leftIcon: null, rightIcon: null },
    { label: "assist / Icon left", variant: "assist" as const, leftIcon: <SquareIcon color="#525252" />, rightIcon: null },
    { label: "assist / Icon right", variant: "assist" as const, leftIcon: null, rightIcon: <SquareIcon color="#525252" /> },
  ];

  function renderMatrix(size: "sm" | "md", heading: string) {
    return (
      <Panel title={heading}>
        <div
          style={{
            alignItems: "start",
            columnGap: 20,
            display: "grid",
            gridTemplateColumns: "180px 1fr 1fr",
            rowGap: 14,
          }}
        >
          <div />
          <p style={{ color: "#a3a3a3", fontSize: 13, margin: 0 }}>Default</p>
          <p style={{ color: "#a3a3a3", fontSize: 13, margin: 0 }}>Disabled</p>
          {textButtonRows.map((row) => (
            <Fragment key={`${heading}-${row.label}`}>
              <p style={{ color: "#737373", fontSize: 13, margin: 0 }}>{row.label}</p>
              <TextButton
                leftIcon={row.leftIcon}
                rightIcon={row.rightIcon}
                size={size}
                variant={row.variant}
              >
                Text Button
              </TextButton>
              <TextButton
                disabled
                leftIcon={
                  row.leftIcon ? <SquareIcon color="#a3a3a3" /> : null
                }
                rightIcon={
                  row.rightIcon ? <SquareIcon color="#a3a3a3" /> : null
                }
                size={size}
                variant={row.variant}
              >
                Text Button
              </TextButton>
            </Fragment>
          ))}
        </div>
      </Panel>
    );
  }

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
              Underlined text actions for lightweight secondary flows, based on the screenshot matrix.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <TextButton size="sm" variant="primary">
              Text Button
            </TextButton>
            <TextButton leftIcon={<SquareIcon color="#525252" />} size="md" variant="assist">
              Text Button
            </TextButton>
          </div>
        </div>
      </Panel>

      {renderMatrix("sm", "Small · 14px")}
      {renderMatrix("md", "Medium · 16px")}

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
              <td style={{ padding: "8px 0" }}>Pretendard 14px</td>
              <td style={{ padding: "8px 0" }}>Semi Bold</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 0" }}>md</td>
              <td style={{ padding: "8px 0" }}>Pretendard 16px</td>
              <td style={{ padding: "8px 0" }}>Semi Bold</td>
            </tr>
          </tbody>
        </table>
      </Panel>
    </>
  );
}

function IconButtonTabContent() {
  return (
    <>
      <SectionTitle>Icon Button</SectionTitle>

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
            <p style={{ fontWeight: 600, margin: "0 0 8px" }}>Icon action sample</p>
            <p style={{ color: "#525252", margin: 0 }}>
              Figma icon button state matrix preview for playground-only verification.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <IconButton aria-label="Normal icon button" size="sm" variant="normal">
              <SquareIcon />
            </IconButton>
            <IconButton aria-label="Background icon button" size="md" variant="background">
              <SquareIcon color="#ffffff" />
            </IconButton>
            <IconButton aria-label="Outline icon button" size="md" variant="outline">
              <SquareIcon />
            </IconButton>
          </div>
        </div>
      </Panel>

      <Panel title="Variant x State">
        <div style={{ display: "grid", gap: 20 }}>
          {[
            { label: "Normal", variant: "normal" as const, iconColor: "#111111" },
            { label: "Background", variant: "background" as const, iconColor: "#ffffff" },
            { label: "Outline", variant: "outline" as const, iconColor: "#111111" },
          ].map((variant) => (
            <div key={`icon-${variant.variant}`}>
              <p style={{ fontWeight: 600, marginBottom: 8, marginTop: 0 }}>{variant.label}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {[
                  { label: "default", visualState: "default" as const },
                  { label: "hover", visualState: "hover" as const },
                  { label: "focused", visualState: "focused" as const },
                  { label: "pressed", visualState: "pressed" as const },
                  { label: "disabled", visualState: "disabled" as const },
                ].map((state) => (
                  <IconButton
                    aria-label={`${variant.label} ${state.label} icon button`}
                    disabled={state.visualState === "disabled"}
                    key={`icon-${variant.variant}-${state.visualState}`}
                    size={variant.variant === "normal" ? "sm" : "md"}
                    variant={variant.variant}
                    visualState={state.visualState}
                  >
                    <SquareIcon
                      color={state.visualState === "disabled" ? "#a3a3a3" : variant.iconColor}
                    />
                  </IconButton>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Figma design notes">
        <div style={{ display: "grid", gap: 12 }}>
          <p style={{ color: "#525252", margin: 0 }}>
            Source node: <code>42:62</code>
          </p>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th align="left">Basis</th>
                <th align="left">Value</th>
                <th align="left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {iconButtonTextStyles.map((style) => (
                <tr key={style.label}>
                  <td style={{ padding: "8px 0" }}>{style.label}</td>
                  <td style={{ padding: "8px 0" }}>{style.font}</td>
                  <td style={{ padding: "8px 0" }}>{style.weight}</td>
                </tr>
              ))}
              <tr>
                <td style={{ padding: "8px 0" }}>Layout</td>
                <td style={{ padding: "8px 0" }}>Normal / Background / Outline</td>
                <td style={{ padding: "8px 0" }}>Three-row structure reconstructed from the screenshot</td>
              </tr>
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
              key={`icon-${token.name}`}
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

function ChipTabContent() {
  const chipStates = [
    { label: "Normal", visualState: "default" as const },
    { label: "Hover", visualState: "hover" as const },
    { label: "Focus", visualState: "focused" as const },
    { label: "Pressed", visualState: "pressed" as const },
    { label: "Disabled", visualState: "disabled" as const },
  ];

  const chipSizes = [
    { label: "Large", size: "lg" as const },
    { label: "Medium", size: "md" as const },
    { label: "Small", size: "sm" as const },
  ];

  return (
    <>
      <SectionTitle>Chip</SectionTitle>

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
            <p style={{ fontWeight: 600, margin: "0 0 8px" }}>Compact selection sample</p>
            <p style={{ color: "#525252", margin: 0 }}>
              Pill chip previews based on tokens and adjusted against the screenshot states.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Chip size="lg" variant="normal">
              Chip
            </Chip>
            <Chip leftIcon={<SquareIcon color="#ffffff" />} size="md" variant="solid">
              Chip
            </Chip>
          </div>
        </div>
      </Panel>

      <Panel title="Normal">
        <div style={{ display: "grid", gap: 16 }}>
          {chipSizes.map((size) => (
            <div key={`normal-${size.size}`}>
              <p style={{ fontWeight: 600, marginBottom: 8, marginTop: 0 }}>{size.label}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
                {chipStates.map((state) => (
                  <Chip
                    key={`normal-text-${size.size}-${state.visualState}`}
                    disabled={state.visualState === "disabled"}
                    size={size.size}
                    variant="normal"
                    visualState={state.visualState}
                  >
                    Chip
                  </Chip>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {chipStates.map((state) => (
                  <Chip
                    disabled={state.visualState === "disabled"}
                    key={`normal-icon-${size.size}-${state.visualState}`}
                    leftIcon={<SquareIcon color={state.visualState === "disabled" ? "#a3a3a3" : "#111111"} />}
                    size={size.size}
                    variant="normal"
                    visualState={state.visualState}
                  >
                    Chip
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Solid">
        <div style={{ display: "grid", gap: 16 }}>
          {chipSizes.map((size) => (
            <div key={`solid-${size.size}`}>
              <p style={{ fontWeight: 600, marginBottom: 8, marginTop: 0 }}>{size.label}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
                {chipStates.map((state) => (
                  <Chip
                    key={`solid-text-${size.size}-${state.visualState}`}
                    disabled={state.visualState === "disabled"}
                    size={size.size}
                    variant="solid"
                    visualState={state.visualState}
                  >
                    Chip
                  </Chip>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {chipStates.map((state) => (
                  <Chip
                    disabled={state.visualState === "disabled"}
                    key={`solid-icon-${size.size}-${state.visualState}`}
                    leftIcon={
                      <SquareIcon color={state.visualState === "disabled" ? "#a3a3a3" : "#ffffff"} />
                    }
                    size={size.size}
                    variant="solid"
                    visualState={state.visualState}
                  >
                    Chip
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Figma design notes">
        <div style={{ display: "grid", gap: 12 }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th align="left">Basis</th>
                <th align="left">Value</th>
                <th align="left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {chipTextStyles.map((style) => (
                <tr key={style.label}>
                  <td style={{ padding: "8px 0" }}>{style.label}</td>
                  <td style={{ padding: "8px 0" }}>{style.font}</td>
                  <td style={{ padding: "8px 0" }}>{style.weight}</td>
                </tr>
              ))}
              <tr>
                <td style={{ padding: "8px 0" }}>Variant</td>
                <td style={{ padding: "8px 0" }}>normal / solid</td>
                <td style={{ padding: "8px 0" }}>Two visual groups visible in the provided screenshot</td>
              </tr>
              <tr>
                <td style={{ padding: "8px 0" }}>Type</td>
                <td style={{ padding: "8px 0" }}>text-only / icon + text</td>
                <td style={{ padding: "8px 0" }}>Both structures are shown for every size</td>
              </tr>
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
          {[
            { name: "radius/full", value: "9999px" },
            { name: "spacing/4", value: "8px" },
            { name: "spacing/5", value: "10px" },
            { name: "spacing/6", value: "12px" },
            { name: "button/primaryBg", value: "#111111" },
            { name: "button/primaryHover", value: "#262626" },
            { name: "button/primaryPressed", value: "#404040" },
            { name: "button/ghostBorder", value: "#d4d4d4" },
            { name: "button/ghostHover", value: "#f2f2f2" },
            { name: "button/ghostPressed", value: "#e5e5e5" },
            { name: "button/disabledBg", value: "#e5e5e5" },
            { name: "button/disabledText", value: "#a3a3a3" },
          ].map((token) => (
            <div
              key={`chip-${token.name}`}
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
      {activeTab === "icon-button" ? <IconButtonTabContent /> : null}
      {activeTab === "chip" ? <ChipTabContent /> : null}
    </main>
  );
}
