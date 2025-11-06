import { type FC, type PropsWithChildren } from "react";
import styles from "./app.module.css";
import { Board } from "../components/board/Board";
import { Provider } from "./Provider";

export const App: FC<PropsWithChildren> = () => {
  /*
    breakpoints = mobile <= 768, everything else is dt
    max content-width = 1440px

    1. <Board /> DONE
    2. <Column /> DONE
    3. <Card /> DONE
    4. Provider DONE
    5. <Modal />, has overlay, clickaway listener, card with padding, close button
    6. ErrorProvider
    6. indexDB storage connection on startup
    7. indexDB (and methods?) exposed via context

  */

  return (
    <Provider>
      <div className={styles.app}>
        <main className={styles.app__container}>
          <Board />
        </main>
      </div>
    </Provider>
  );
};
