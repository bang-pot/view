import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>BangPot frontend bootstrap</h1>
      <p>Round 1 auth flow entry points are ready.</p>
      <ul>
        <li><Link href="/login">로그인</Link></li>
        <li><Link href="/protected-demo">Protected demo</Link></li>
      </ul>
    </main>
  );
}
