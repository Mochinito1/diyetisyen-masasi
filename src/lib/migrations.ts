/**
 * Tek seferlik veri düzeltmeleri (her tarayıcıda bir kez çalışır).
 * v1: Diyetisyenlerin yanlışlıkla kaldırdığı besinler geri yüklenir; kaldırma artık yalnızca yöneticide.
 */
export function runMigrations() {
  try {
    if (localStorage.getItem('dm.removedReset') !== 'v1') {
      localStorage.removeItem('dm.removedFoods')
      localStorage.setItem('dm.removedReset', 'v1')
    }
  } catch { /* gizli sekme */ }
}