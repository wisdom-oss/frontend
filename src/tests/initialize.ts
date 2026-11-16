import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import {setupZonelessTestEnv} from "jest-preset-angular/setup-env/zoneless/index.mjs";

import "./matchers";

dayjs.extend(duration);
setupZonelessTestEnv();
