import { useNavigate } from "react-router-dom";
import { Button, EmptyState } from "../../shared/ui";
import styles from "./NotFoundPage.module.scss";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className={styles.page}>
      <EmptyState
        action={<Button onClick={() => navigate("/descriptors")}>К дескрипторам</Button>}
        description="Такого маршрута в первом макете нет."
        title="Раздел не найден"
      />
    </main>
  );
}
