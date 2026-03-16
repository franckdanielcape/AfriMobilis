import styles from './loading.module.css';

export default function DashboardLoading() {
    return (
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Chargement...</p>
        </div>
    );
}
