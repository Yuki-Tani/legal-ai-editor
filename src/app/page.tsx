import Link from "next/link";
import styles from "./page.module.css";
import NagurigakiView from "./NagurigakiView";

export default function Home() {
  return (
    <div className={styles.homePage}>
      <h2>HOME</h2>
      <Link href="/doc-editor"> ドキュメントエディタへ </Link>
      <br />
      <Link href="/sample"> Next.js サンプルページへ </Link>

      <NagurigakiView />
    </div>
  );
}
