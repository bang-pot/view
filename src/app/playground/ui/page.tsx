import { Fragment } from "react";
import Link from "next/link";

import { Button } from "@/shared/ui/Button";
import { Checkbox } from "@/shared/ui/Checkbox";
import { Chip } from "@/shared/ui/Chip";
import { IconButton } from "@/shared/ui/IconButton";
import { Radio } from "@/shared/ui/Radio";
import { Select } from "@/shared/ui/Select";
import { SwitchBox } from "@/shared/ui/SwitchBox";
import { TextField } from "@/shared/ui/TextField";
import { Textarea } from "@/shared/ui/Textarea";
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

type TabKey =
  | "button"
  | "text-button"
  | "icon-button"
  | "chip"
  | "text-field"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "switch-box";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "button", label: "Button" },
  { key: "text-button", label: "Text Button" },
  { key: "icon-button", label: "Icon Button" },
  { key: "chip", label: "Chip" },
  { key: "text-field", label: "Text Field" },
  { key: "textarea", label: "Textarea" },
  { key: "select", label: "Select" },
  { key: "checkbox", label: "Checkbox" },
  { key: "radio", label: "Radio" },
  { key: "switch-box", label: "Switch Box" },
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
  return tab === "text-button" ||
    tab === "icon-button" ||
    tab === "chip" ||
    tab === "text-field" ||
    tab === "textarea" ||
    tab === "select" ||
    tab === "checkbox" ||
    tab === "radio" ||
    tab === "switch-box"
    ? tab
    : "button";
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

const textFieldTextStyles = [
  { label: "Input", font: "Pretendard 14px", weight: "Regular" },
  { label: "Label", font: "Pretendard 12px", weight: "Medium" },
  { label: "Supporting", font: "Pretendard 12px", weight: "Regular" },
];

const textFieldTokens = [
  { name: "text.primary", value: "#111111" },
  { name: "text.secondary", value: "#525252" },
  { name: "text.disabled", value: "#a3a3a3" },
  { name: "background.default", value: "#ffffff" },
  { name: "background.subtle", value: "#f9f9f9" },
  { name: "border.default", value: "#e5e5e5" },
  { name: "status.danger", value: "#f5494a" },
  { name: "radius.md", value: "12px" },
  { name: "spacing.4", value: "8px" },
  { name: "spacing.6", value: "12px" },
];

const textareaTextStyles = [
  { label: "Input", font: "Pretendard 14px", weight: "Regular" },
  { label: "Label", font: "Pretendard 12px", weight: "Medium" },
  { label: "Supporting", font: "Pretendard 11px", weight: "Regular" },
];

const selectTextStyles = [
  { label: "Input", font: "Pretendard 14px", weight: "Regular" },
  { label: "Label", font: "Pretendard 12px", weight: "Medium" },
];

const textareaTokens = [
  { name: "text.primary", value: "#111111" },
  { name: "text.secondary", value: "#525252" },
  { name: "text.disabled", value: "#a3a3a3" },
  { name: "background.default", value: "#ffffff" },
  { name: "background.subtle", value: "#f9f9f9" },
  { name: "border.default", value: "#e5e5e5" },
  { name: "status.danger", value: "#f5494a" },
  { name: "radius.md", value: "12px" },
  { name: "spacing.5", value: "10px" },
  { name: "spacing.6", value: "12px" },
];

const selectTokens = [
  { name: "text.primary", value: "#111111" },
  { name: "text.disabled", value: "#a3a3a3" },
  { name: "background.default", value: "#ffffff" },
  { name: "background.subtle", value: "#f9f9f9" },
  { name: "border.default", value: "#e5e5e5" },
  { name: "status.danger", value: "#f5494a" },
  { name: "radius.md", value: "12px" },
  { name: "spacing.6", value: "12px" },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 32,
        fontWeight: 700,
        lineHeight: 1.2,
        marginBottom: 20,
        marginTop: 0,
      }}
    >
      {children}
    </h2>
  );
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
        border: "1px solid #eaeaea",
        borderRadius: 8,
        marginBottom: 24,
        padding: 24,
      }}
    >
      <h3 style={{ fontSize: 14, fontWeight: 600, color: "#111111", marginBottom: 16, marginTop: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</h3>
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
            border: "1px solid #eaeaea",
            borderRadius: 8,
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
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
            Source node: <code style={{ fontFamily: "monospace", background: "#f4f4f5", padding: "2px 6px", borderRadius: 4, fontSize: 13, color: "#111111" }}>27:614</code>
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
                  <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>{style.label}</td>
                  <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>{style.font}</td>
                  <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>{style.weight}</td>
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
                border: "1px solid #eaeaea",
                borderRadius: 8,
                padding: 16,
                background: "#fcfcfc",
              }}
            >
              <p style={{ fontWeight: 600, margin: "0 0 6px", fontSize: 13, color: "#111111" }}>{token.name}</p>
              <p style={{ color: "#737373", margin: 0, fontSize: 13, fontFamily: "monospace", letterSpacing: "0.02em" }}>{token.value}</p>
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
            border: "1px solid #eaeaea",
            borderRadius: 8,
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
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
              <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>sm</td>
              <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>Pretendard 14px</td>
              <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>Semi Bold</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>md</td>
              <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>Pretendard 16px</td>
              <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>Semi Bold</td>
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
            border: "1px solid #eaeaea",
            borderRadius: 8,
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
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
            Source node: <code style={{ fontFamily: "monospace", background: "#f4f4f5", padding: "2px 6px", borderRadius: 4, fontSize: 13, color: "#111111" }}>42:62</code>
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
                  <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>{style.label}</td>
                  <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>{style.font}</td>
                  <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>{style.weight}</td>
                </tr>
              ))}
              <tr>
                <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>Layout</td>
                <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>Normal / Background / Outline</td>
                <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>Three-row structure reconstructed from the screenshot</td>
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
                border: "1px solid #eaeaea",
                borderRadius: 8,
                padding: 16,
                background: "#fcfcfc",
              }}
            >
              <p style={{ fontWeight: 600, margin: "0 0 6px", fontSize: 13, color: "#111111" }}>{token.name}</p>
              <p style={{ color: "#737373", margin: 0, fontSize: 13, fontFamily: "monospace", letterSpacing: "0.02em" }}>{token.value}</p>
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
            border: "1px solid #eaeaea",
            borderRadius: 8,
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
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
                  <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>{style.label}</td>
                  <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>{style.font}</td>
                  <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>{style.weight}</td>
                </tr>
              ))}
              <tr>
                <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>Variant</td>
                <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>normal / solid</td>
                <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>Two visual groups visible in the provided screenshot</td>
              </tr>
              <tr>
                <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>Type</td>
                <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>text-only / icon + text</td>
                <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>Both structures are shown for every size</td>
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
                border: "1px solid #eaeaea",
                borderRadius: 8,
                padding: 16,
                background: "#fcfcfc",
              }}
            >
              <p style={{ fontWeight: 600, margin: "0 0 6px", fontSize: 13, color: "#111111" }}>{token.name}</p>
              <p style={{ color: "#737373", margin: 0, fontSize: 13, fontFamily: "monospace", letterSpacing: "0.02em" }}>{token.value}</p>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}

function TextFieldTabContent() {
  const rows = [
    { label: "No icon", trailingIcon: null },
    { label: "With icon", trailingIcon: <SquareIcon color="#a3a3a3" /> },
  ];

  const columns = [
    {
      key: "default",
      title: "Default",
      props: { helperText: "Helper text", placeholder: "Placeholder" },
    },
    {
      key: "focused",
      title: "Focus",
      props: {
        defaultValue: "Input value",
        helperText: "Helper text",
        placeholder: "Placeholder",
        visualState: "focused" as const,
      },
    },
    {
      key: "error",
      title: "Error",
      props: {
        defaultValue: "Input value",
        errorMessage: "Error message",
        hasError: true,
        placeholder: "Placeholder",
      },
    },
    {
      key: "disabled",
      title: "Disabled",
      props: {
        disabled: true,
        helperText: "Helper text",
        placeholder: "Placeholder",
      },
    },
  ];

  function renderVariant(variant: "outline" | "filled", title: string) {
    return (
      <Panel title={title}>
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          }}
        >
          {columns.map((column) => (
            <section
              key={`${title}-${column.key}`}
              aria-label={`${title} ${column.title}`}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                display: "grid",
                gap: 16,
                padding: 16,
              }}
            >
              <p
                style={{
                  color: "#737373",
                  fontSize: 14,
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                {column.title}
              </p>
              {rows.map((row) => (
                <div
                  key={`${title}-${column.key}-${row.label}`}
                  style={{
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <p style={{ color: "#a3a3a3", fontSize: 13, margin: 0 }}>{row.label}</p>
                  <TextField
                    {...column.props}
                    label="Label"
                    trailingIcon={
                      row.trailingIcon
                        ? column.key === "error"
                          ? <SquareIcon color="#f5494a" />
                          : row.trailingIcon
                        : null
                    }
                    variant={variant}
                  />
                </div>
              ))}
            </section>
          ))}
        </div>
      </Panel>
    );
  }

  return (
    <>
      <SectionTitle>Text Field</SectionTitle>

      <Panel title="Interactive preview">
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          }}
        >
          <TextField helperText="Helper text" label="Label" placeholder="Placeholder" variant="outline" />
          <TextField
            defaultValue="Input value"
            label="Label"
            trailingIcon={<SquareIcon color="#a3a3a3" />}
            variant="filled"
          />
        </div>
      </Panel>

      {renderVariant("outline", "Outline")}
      {renderVariant("filled", "Filled")}

      <Panel title="Figma text styles">
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th align="left">Type</th>
              <th align="left">Font</th>
              <th align="left">Weight</th>
            </tr>
          </thead>
          <tbody>
            {textFieldTextStyles.map((style) => (
              <tr key={style.label}>
                <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>{style.label}</td>
                <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>{style.font}</td>
                <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>{style.weight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title="Figma tokens">
        <div
          style={{
            display: "grid",
            gap: 8,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {textFieldTokens.map((token) => (
            <div
              key={`text-field-${token.name}`}
              style={{
                border: "1px solid #eaeaea",
                borderRadius: 8,
                padding: 16,
                background: "#fcfcfc",
              }}
            >
              <p style={{ fontWeight: 600, margin: "0 0 6px", fontSize: 13, color: "#111111" }}>{token.name}</p>
              <p style={{ color: "#737373", margin: 0, fontSize: 13, fontFamily: "monospace", letterSpacing: "0.02em" }}>{token.value}</p>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}

function TextareaTabContent() {
  const columns = [
    {
      key: "default",
      title: "Default",
      props: {
        footerText: "텍스트",
        helperText: "메시지에 바티코를 적어요.",
        maxLength: 2000,
        placeholder: "내용을 입력해주세요.",
      },
    },
    {
      key: "focused",
      title: "Focus",
      props: {
        defaultValue:
          "청천 이는 트기만 하여도 가슴이 설레는 말이다.\n\n청천 나의 두 손을 가슴에 대고, 불량아 같은 심장의 고동을 들어 보라. 청춘의 피는 끓는다.",
        footerText: "텍스트",
        helperText: "메시지에 바티코를 적어요.",
        maxLength: 2000,
        visualState: "focused" as const,
      },
    },
    {
      key: "error",
      title: "Error",
      props: {
        defaultValue:
          "청천 이는 트기만 하여도 가슴이 설레는 말이다.\n\n청천 나의 두 손을 가슴에 대고, 불량아 같은 심장의 고동을 들어 보라. 청춘의 피는 끓는다.",
        errorMessage: "메시지에 바티코를 적어요.",
        footerText: "텍스트",
        hasError: true,
        maxLength: 2000,
      },
    },
    {
      key: "disabled",
      title: "Disabled",
      props: {
        disabled: true,
        footerText: "텍스트",
        helperText: "메시지에 바티코를 적어요.",
        maxLength: 2000,
        placeholder: "내용을 입력해주세요.",
      },
    },
  ];

  function renderVariant(variant: "outline" | "filled", title: string) {
    return (
      <Panel title={title}>
        <div
          style={{
            alignItems: "start",
            columnGap: 20,
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            rowGap: 18,
          }}
        >
          {columns.map((column) => (
            <div key={`${title}-${column.key}`} style={{ display: "grid", gap: 8 }}>
              <p style={{ color: "#a3a3a3", fontSize: 13, margin: 0 }}>{column.title}</p>
              <Textarea
                {...column.props}
                label="주제"
                variant={variant}
              />
            </div>
          ))}
        </div>
      </Panel>
    );
  }

  return (
    <>
      <SectionTitle>Textarea</SectionTitle>

      <Panel title="Interactive preview">
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          }}
        >
          <Textarea
            footerText="텍스트"
            helperText="메시지에 바티코를 적어요."
            label="주제"
            maxLength={2000}
            placeholder="내용을 입력해주세요."
            variant="outline"
          />
          <Textarea
            defaultValue="청천 이는 트기만 하여도 가슴이 설레는 말이다."
            footerText="텍스트"
            helperText="메시지에 바티코를 적어요."
            label="주제"
            maxLength={2000}
            variant="filled"
          />
        </div>
      </Panel>

      {renderVariant("outline", "Outline")}
      {renderVariant("filled", "Filled")}

      <Panel title="Figma text styles">
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th align="left">Type</th>
              <th align="left">Font</th>
              <th align="left">Weight</th>
            </tr>
          </thead>
          <tbody>
            {textareaTextStyles.map((style) => (
              <tr key={style.label}>
                <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>{style.label}</td>
                <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>{style.font}</td>
                <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>{style.weight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title="Figma tokens">
        <div
          style={{
            display: "grid",
            gap: 8,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {textareaTokens.map((token) => (
            <div
              key={`textarea-${token.name}`}
              style={{
                border: "1px solid #eaeaea",
                borderRadius: 8,
                padding: 16,
                background: "#fcfcfc",
              }}
            >
              <p style={{ fontWeight: 600, margin: "0 0 6px", fontSize: 13, color: "#111111" }}>{token.name}</p>
              <p style={{ color: "#737373", margin: 0, fontSize: 13, fontFamily: "monospace", letterSpacing: "0.02em" }}>{token.value}</p>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}

function SelectTabContent() {
  const options = [
    { label: "선택하세요", value: "" },
    { label: "선택됨", value: "selected" },
  ];

  const columns = [
    {
      key: "default",
      title: "Default",
      props: {
        defaultValue: "",
      },
    },
    {
      key: "hover",
      title: "Hover",
      props: {
        defaultValue: "selected",
        visualState: "hover" as const,
      },
    },
    {
      key: "focus",
      title: "Focus",
      props: {
        defaultValue: "selected",
        visualState: "focused" as const,
      },
    },
    {
      key: "open",
      title: "Open",
      props: {
        defaultValue: "selected",
        visualState: "open" as const,
      },
    },
    {
      key: "error",
      title: "Error",
      props: {
        defaultValue: "selected",
        errorMessage: "에러 메시지",
        hasError: true,
      },
    },
    {
      key: "disabled",
      title: "Disabled",
      props: {
        disabled: true,
        defaultValue: "",
      },
    },
  ];

  return (
    <>
      <SectionTitle>Select</SectionTitle>

      <Panel title="Interactive preview">
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          }}
        >
          <Select defaultValue="" label="Select" options={options} />
          <Select defaultValue="selected" label="Select" options={options} visualState="focused" />
        </div>
      </Panel>

      <Panel title="State matrix">
        <div
          style={{
            alignItems: "start",
            columnGap: 20,
            display: "grid",
            gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
            rowGap: 18,
          }}
        >
          {columns.map((column) => (
            <div key={column.key} style={{ display: "grid", gap: 8 }}>
              <p style={{ color: "#a3a3a3", fontSize: 13, margin: 0 }}>{column.title}</p>
              <Select
                {...column.props}
                label="Select"
                options={options}
              />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Figma text styles">
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th align="left">Type</th>
              <th align="left">Font</th>
              <th align="left">Weight</th>
            </tr>
          </thead>
          <tbody>
            {selectTextStyles.map((style) => (
              <tr key={style.label}>
                <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>{style.label}</td>
                <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>{style.font}</td>
                <td style={{ padding: "8px 0", fontSize: 13, color: "#525252" }}>{style.weight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title="Figma tokens">
        <div
          style={{
            display: "grid",
            gap: 8,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {selectTokens.map((token) => (
            <div
              key={`select-${token.name}`}
              style={{
                border: "1px solid #eaeaea",
                borderRadius: 8,
                padding: 16,
                background: "#fcfcfc",
              }}
            >
              <p style={{ fontWeight: 600, margin: "0 0 6px", fontSize: 13, color: "#111111" }}>{token.name}</p>
              <p style={{ color: "#737373", margin: 0, fontSize: 13, fontFamily: "monospace", letterSpacing: "0.02em" }}>{token.value}</p>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}

function CheckboxTabContent() {
  return (
    <>
      <SectionTitle>Checkbox</SectionTitle>

      <Panel title="Interactive preview">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <Checkbox defaultChecked label="라벨" />
        </div>
      </Panel>

      <Panel title="Checkbox">
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          }}
        >
          <div style={{ display: "grid", gap: 8 }}>
            <p style={{ color: "#a3a3a3", fontSize: 13, margin: 0 }}>On</p>
            <Checkbox defaultChecked label="라벨" />
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <p style={{ color: "#a3a3a3", fontSize: 13, margin: 0 }}>Off</p>
            <Checkbox label="라벨" />
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <p style={{ color: "#a3a3a3", fontSize: 13, margin: 0 }}>Disabled</p>
            <Checkbox disabled label="라벨" />
          </div>
        </div>
      </Panel>

    </>
  );
}

function RadioTabContent() {
  return (
    <>
      <SectionTitle>Radio</SectionTitle>

      <Panel title="Interactive preview">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <Radio defaultChecked label="라벨" name="interactive-preview-radio" />
        </div>
      </Panel>

      <Panel title="Radio">
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          }}
        >
          <div style={{ display: "grid", gap: 8 }}>
            <p style={{ color: "#a3a3a3", fontSize: 13, margin: 0 }}>On</p>
            <Radio defaultChecked label="라벨" name="radio-preview" />
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <p style={{ color: "#a3a3a3", fontSize: 13, margin: 0 }}>Off</p>
            <Radio label="라벨" name="radio-preview" />
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <p style={{ color: "#a3a3a3", fontSize: 13, margin: 0 }}>Disabled</p>
            <Radio disabled label="라벨" name="radio-preview-disabled" />
          </div>
        </div>
      </Panel>
    </>
  );
}

function SwitchBoxTabContent() {
  return (
    <>
      <SectionTitle>Switch Box</SectionTitle>

      <Panel title="Interactive preview">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <SwitchBox defaultChecked label="라벨" />
        </div>
      </Panel>

      <Panel title="Switch Box">
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          }}
        >
          <div style={{ display: "grid", gap: 8 }}>
            <p style={{ color: "#a3a3a3", fontSize: 13, margin: 0 }}>On</p>
            <SwitchBox defaultChecked label="라벨" />
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <p style={{ color: "#a3a3a3", fontSize: 13, margin: 0 }}>Off</p>
            <SwitchBox label="라벨" />
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <p style={{ color: "#a3a3a3", fontSize: 13, margin: 0 }}>Disabled</p>
            <SwitchBox defaultChecked disabled label="라벨" />
          </div>
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
        background: "#fcfcfc",
        minHeight: "100vh",
        padding: 40,
      }}
    >
      <div
        style={{
          alignItems: "start",
          columnGap: 40,
          display: "grid",
          gridTemplateColumns: "200px minmax(0, 1fr)",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <aside
          style={{
            position: "sticky",
            top: 40,
          }}
        >
          <h1 style={{ marginBottom: 32, marginTop: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>UI Playground</h1>

          <nav aria-label="Component tabs">
            <ul
              style={{
                display: "grid",
                gap: 4,
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
                        background: "transparent",
                        borderLeft: isActive ? "2px solid #111111" : "2px solid transparent",
                        color: isActive ? "#111111" : "#737373",
                        display: "flex",
                        fontWeight: isActive ? 600 : 400,
                        padding: "8px 12px",
                        textDecoration: "none",
                        transition: "all 0.15s ease",
                        fontSize: 14,
                      }}
                    >
                      {tab.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        <section>
          {activeTab === "button" ? <ButtonTabContent /> : null}
          {activeTab === "text-button" ? <TextButtonTabContent /> : null}
          {activeTab === "icon-button" ? <IconButtonTabContent /> : null}
          {activeTab === "chip" ? <ChipTabContent /> : null}
          {activeTab === "text-field" ? <TextFieldTabContent /> : null}
          {activeTab === "textarea" ? <TextareaTabContent /> : null}
          {activeTab === "select" ? <SelectTabContent /> : null}
          {activeTab === "checkbox" ? <CheckboxTabContent /> : null}
          {activeTab === "radio" ? <RadioTabContent /> : null}
          {activeTab === "switch-box" ? <SwitchBoxTabContent /> : null}
        </section>
      </div>
    </main>
  );
}
