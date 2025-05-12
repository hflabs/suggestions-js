Виджет для сервиса [подсказок DaData.ru](https://dadata.ru/suggestions/).

- [Установка](#установка)
- [Использование](#использование)
- [Параметры](#параметры)
- [Коллбэки](#коллбэки)
- [События](#события)
- [Методы](#методы)
- [Гранулярные подсказки](#гранулярные-подсказки)
- [Вспомогательные функции](#вспомогательные-функции)
- [Использование с TypeScript](#использование-с-typescript)
- [Примеры использования](#примеры-использования)

## Установка

```bash
npm install @dadata/suggestions
```

Подключение стилей:

```css
@import "@dadata/suggestions/styles";

.suggestions-input {
    /* можно кастомизировать */
}
```

## Использование

Чтобы подключить подсказки к текстовому полю на странице, его нужно передать в метод **createSuggestions**:

```js
import { createSuggestions } from "@dadata/suggestions";

const suggestions = createSuggestions(input, options);
```

В качестве второго параметра виджет принимает объект с опциями и коллбэками. Все параметры опциональные, исключая параметр **type** (тип подсказок).

## Параметры

### Основные

#### type

Тип подсказок. Обязательный.

Тип: `"name" | "address" | "bank" | "email" | "party" | string`

#### token

API-ключ. Обязателен для пользователей «Дадаты».

Тип: `string`

По умолчанию: не задано.

### Базовые настройки

#### minChars

Минимальная длина текста, после которой включаются подсказки.

Тип: `number`

По умолчанию: `1`

#### deferRequestBy<br>

Период ожидания перед отправкой запроса на сервер подсказок, в миллисекундах.
Позволяет не перегружать сервер запросами, если пользователь очень быстро печатает.

Тип: `number`

По умолчанию: `100`

#### autoSelectFirst

Автоматически выбирать первую подсказку в списке.

Тип: `boolean`

По умолчанию: `false`

#### hint

Поясняющий текст, который показывается в выпадающем списке над подсказками. При `hint=false` текст показываться не будет.

Тип: `string | false`

По умолчанию: `"Выберите вариант или продолжите ввод"`

#### noSuggestionsHint

Поясняющий текст, который показывается, если для введённого запроса ничего не найдено.
Текст зависит от типа подсказок. При `noSuggestionsHint=false` текст показываться не будет.

Тип: `string | false`

По умолчанию: `"Неизвестное значение"`

#### enrichmentEnabled

Обогащать подсказку при выборе (если обогащение возможно в зависимости от типа подсказок).
Обогащение производится дополнительным запросом на сервер подсказок.

Тип: `boolean`

По умолчанию: `true`

#### params

Дополнительные параметры для передачи с запросом на сервер подсказок.
Может быть или в виде объекта с параметрами, или функцией, принимающей запрос `query` и возвращающей объект параметров.

Тип:

```ts
Record<string, unknown>

| (query: string) =>
Record<string, unknown>
```

По умолчанию: не задано.

### Настройки API

#### serviceUrl

Базовый URL сервера подсказок.

Тип: `string`

По умолчанию: `https://suggestions.dadata.ru/suggestions/api/4_1/rs`

#### url

Полный url для запроса подсказок. Если не передан, то конструируется на основе `serviceUrl`:

```text
{serviceUrl}/{method}/{type}
```

Тип: `string`

По умолчанию: не задано.

#### headers

Объект с дополнительными HTTP-заголовками, которые необходимо передать на сервер.

Тип: `Record<string, string>`

По умолчанию: не задано.

#### timeout

Таймаут для запросов к серверу подсказок в миллисекундах.
Если запрос не успевает выполниться за указанное время, то будет отменен.

Тип: `number`

По умолчанию: `3000`

#### partner

Идентификатор в партнерской программе.

Тип: `string`

По умолчанию: не задано.

#### preventBadQueries

Предотвращает отправку запросов к серверу, если по предыдущему запросу не было найдено подсказок. Например, если по запросу "мос" не было подсказок, то запрос "моск" не будет отправлен.

Тип: `boolean`

По умолчанию: `false`

#### noCache

Отключает кэширование ответов сервера.

Тип: `boolean`

По умолчанию: `false`

### Настройки по типам подсказок

#### geolocation

Для подсказок по адресам (`type=address`), банкам (`type=bank`) и организациям (`type=party`).
Определяет местоположение по IP и устанавливает его в качестве приоритетного при поиске подсказок (`locations_boost`).

Если в параметрах передан собственный параметр `locations_boost` - перезаписывает его.

Тип: `boolean`

По умолчанию: `true`

#### suggest_local

Для подсказок по email (`type=email`).
Включает подсказки по локальной (до символа `@`) части email-адреса.

Тип: `boolean`

По умолчанию: `true`

### Настройки UI

#### mobileWidth

Максимальная ширина экрана в px, при которой будет применен вид, адаптированный для мобильных устройств.

Тип: `number`

По умолчанию: `600`

#### closeDelay

Время в миллисекундах, на которое будет отложено очищение списка подсказок при закрытии.

Позволяет реализовать анимацию закрытия списка. Открытый список с подсказками получает css-класс `suggestions-wrapper--active`, при закрытии активный класс удаляется, и по истечению `closeDelay` список очищается.

Тип: `number`

По умолчанию: не задано.

#### scrollOnFocus

Прокручивать текстовое поле к верхней границе экрана при фокусе. Если настройка включена, действует только на мобильных устройствах.

Тип: `boolean`

По умолчанию: `false`

#### tabDisabled

Предотвратить поведение по умолчанию при нажатии `Tab` в текстовом поле.

Тип: `boolean`

По умолчанию: `false`

#### triggerSelectOnBlur

Автоматически подставлять подходящую подсказку из списка, когда текстовое поле теряет фокус.

Тип: `boolean`

По умолчанию: `true`

#### triggerSelectOnEnter

Автоматически подставлять подходящую подсказку из списка при нажатии на `Enter`.

Тип: `boolean`

По умолчанию: `true`

#### triggerSelectOnSpace

Автоматически подставлять подходящую подсказку из списка при нажатии на пробел.

Тип: `boolean`

По умолчанию: `false`

## Коллбэки

В объекте `options` помимо параметров виджета можно передать коллбэки (функции-обработчики для событий, происходящих в работе виджета). Все коллбэки опциональные, `this` привязано к input-элементу.

### onSearchStart

Вызывается перед отправкой запроса к серверу подсказок. Здесь можно модифицировать параметры (модифицировать аргумент `params`) или вернуть `false` чтобы предотвратить запрос.

```ts
(params: Record<string, unknown>) => void | false;
```

### onSearchError

Вызывается, если сервер вернул ошибку.

```ts
(
    query: string | null,
    res: Response | undefined,
    textStatus: string,
    errorThrown: string
) => void;
```

### onSuggestionsFetch

Вызывается, когда подсказки получены и проверен их формат. Здесь их можно отсортировать или отфильтровать перед дальнейшей обработкой.

В `suggestions` передается массив полученных подсказок. Можно изменять непосредственно этот массив, либо вернуть новый массив.

```ts
(suggestions: Suggestion[]) => Suggestion[] | void;
```

### onSearchComplete</td>

Вызывается при получении ответа от сервера и содержит финальный список подсказок (вызывается после `onSuggestionsFetch`). В `suggestions` передается массив полученных подсказок.

```ts
(query: string, suggestions: Suggestion[]) => void;
```

### onSelect

Вызывается при выборе подсказки (как при выборе пользователя, так и при автоматическом).

Аргумент `changed` показывает, было ли реально выбрано новое значение (`true`), или только обогащено текущее (`false`), т.е. когда `suggestion.value` осталось прежним, а только обновились поля в `suggestion.data`

```ts
(suggestion: Suggestion, changed: boolean) => void;
```

### onSelectNothing

Вызывается, пользователь нажал `ENTER` или input-элемент потерял фокус, а подходящей подсказки нет.

```ts
(query: string) => void;
```

### onInvalidateSelection

Вызывается при сбросе выбранной раньше подсказки после изменения значения в текстовом поле.

```ts
(suggestion: Suggestion) => void;
```

### beforeRender

Вызывается перед показом выпадающего списка подсказок. В аргументе `container` получает html-элемент контейнера, в котором будет отображен список подсказок.

```ts
(container: HTMLElement) => void;
```

### beforeFormat

Преобразование объекта подсказки перед ее отображением в списке. Позволяет сохранить стандартное форматирование подсказки в списке, но изменить отображаемые данные. Не сохраняет изменения в оригинальной подсказке (изменения применяются только для отображения).

```ts
(suggestion: Suggestion, query: string) => Suggestion;
```

### formatResult

Форматирование подсказки перед ее отображением в списке. Возвращает строку (обычный текст или html-разметка), которая будет выведена в списке подсказок как есть.

```ts
(
    value: string,
    currentValue: string,
    suggestion: Suggestion,
    options: { unformattableTokens: string[] }
) => string;
```

### formatSelected

Возвращает строку для вставки в поле ввода при выборе подсказки. Заменяет `suggestion.value` на переданное значение.

Если возвращает `null` - будет использовано стандартное значение подсказки.

```ts
(suggestion: Suggestion) => string | null;
```

## События

Виджет вызывает события (`CustomEvent`) на текстовом поле, к которому он подключен, подписаться на них можно с помощью метода `addEventListener`

### suggestions-clear

Список подсказок очищен через метод `clear()`.

Параметры в `event.detail`: нет.

### suggestions-set

Установлена подсказка через метод `setSuggestion()`.

Параметры в `event.detail`: нет.

### suggestions-fixdata

Восстановлен объект подсказки через метод `fixData()`.

Параметры в `event.detail`:

```ts
{
    suggestion: Suggestion;
}
```

### suggestions-dispose

Виджет удален через метод `dispose()`.

Параметры в `event.detail`: нет.

### suggestions-invalidateselection

Сброшена ранее сохраненная подсказка (вызывается аналогично с коллбэком `onInvalidateSelection`).

Параметры в `event.detail`:

```ts
{
    suggestion: Suggestion;
}
```

### suggestions-select

Выбрана подсказка из списка (вызывается аналогично с коллбэком `onSelect`).

Параметры в `event.detail`:

```ts
{
    suggestion: Suggestion;
    suggestionChanged: boolean;
}
```

### suggestions-selectnothing

Нет подходящей подсказки для выбора (вызывается аналогично с коллбэком `onSelectNothing`).

Параметры в `event.detail`:

```ts
{
    query: string;
}
```

## Методы

При подключении подсказок к текстовому полю с помощью метода `createSuggestions` возвращается объект с методами управления виджетом:

### clear

Очищает кэш запросов, список подсказок и значение в текстовом поле.

```ts
() => void;
```

### clearCache

Очищает только кэш запросов.

```ts
() => void;
```

### disable

Отключает виджет.

```ts
() => void;
```

### enable

Включает виджет.

```ts
() => void;
```

### dispose

Удаляет виджет.

```ts
() => void;
```

### hide

Прячет список подсказок.

```ts
() => void;
```

### updateSuggestions

Показывает список подсказок.

```ts
() => void;
```

### setOptions

Устанавливает параметры и коллбеки виджета.

```ts
(newOptions: Partial<Options>) => void;
```

### getOptions

Возвращает текущие опции виджета.

```ts
() => void;
```

### fixData

Запрашивает подсказку по переданному значению `query` и выбирает ее. Объект подсказки возвращается асинхронно в событии `suggestions-fixdata` на текстовом поле.

```ts
(query: string) => void;
```

### setSuggestion

Запоминает переданный объект подсказки и устанавливает его значение в поле.

```ts
(suggestion: Suggestion) => void;
```

### getSelection

Возвращает объект выбранной подсказки.

```ts
() => Suggestion | null;
```

### getSelectedIndex

Возвращает индекс выбранной подсказки.

```ts
() => number;
```

### getSuggestions

Возвращает массив подсказок.

```ts
() => Suggestion[];
```

### getInput

Возвращает input-элемент, к которому подключены подсказки.

```ts
() => HTMLInputElement;
```

### getCurrentValue

Возвращает строковое значение выбранной подсказки (текущее значение input-элемента).

```ts
() => string;
```

### getLocation

Возвращает адрес, определенный через геолокацию.

```ts
() => Promise<Suggestion | null>;
```

## Гранулярные подсказки

Для подсказок по адресам (`type=address`) возможна работа виджета в гранулярном режиме (адрес по частям в разных полях). Для этого в качестве третьего аргумента можно передать родительский экземпляр подсказок, который будет ограничивать подсказки в текущем поле:

```js
import { createSuggestions } from "@dadata/suggestions";

const regionInput = document.getElementById("region");
const cityInput = document.getElementById("city");

const regionOptions = {
    type: "address",
    params: { from_bound: { value: "region" }, to_bound: { value: "region" } },
};

const cityOptions = {
    type: "address",
    params: { from_bound: { value: "city" }, to_bound: { value: "city" } },
};

const regionSuggs = createSuggestions(region, regionOptions);
// подсказки по городам будут ограничены значением в поле региона
const citySuggs = createSuggestions(region, cityOptions, regionSuggs);
```

## Вспомогательные функции

Помимо основного метода `createSuggestions` виджет экспортирует вспомогательные функции `getBoundedValue` и `getLocation`.

### getBoundedValue

Возвращает строковое значение подсказки в указанных границах `bounds` для подсказок по адресам:

```ts
interface Bounds {
    from_bound: { value: string };
    to_bound: { value: string };
}

interface Options {
    bounds: Bounds;
    suggestion: Suggestion;
    type: "address";
}

type getBoundedValue = (options: Options) => string;
```

```js
import { getBoundedValue, createSuggestions } from "@dadata/suggestions";

const bounds = {
    from_bound: { value: "region" },
    to_bound: { value: "city" },
};

const suggestions = createSuggestions(input, {
    type: "address",
    formatSelected(suggestion) {
        // вернет значение подсказки от региона до города
        // в соответствии с переданными границами bounds
        return getBoundedValue(bounds, suggestion, "address");
    },
});
```

### getLocation

Возвращает текущую геолокацию по IP:

```ts
interface API_OPTIONS {
    url?: string;
    headers?: Record<string, string>;
    token?: string;
    serviceUrl?: string;
    partner?: string;
    timeout?: number;
}

type getLocation = (options?: API_OPTIONS) => Promise<Suggestion | null>;
```

```js
import { getLocation } from "@dadata/suggestions";

const token = /* */;

getLocation({ token }).then((location) => {
    if (location) console.log(location.data.city);
})
```

## Использование с TypeScript

Виджет включает в себя декларации типов, которые должны работать из коробки

```ts
import type { Options, Suggestion, SuggestionsType } from "@dadata/suggestions";

const options: Options = {};
```

Объект подсказки - это опциональный generic, по умолчанию типизирован без детализации объекта в поле `data`:

```ts
type AnyData = { [K: string]: any };

interface Suggestion<T = AnyData> {
    value: string;
    unrestricted_value: string;
    data: T;
}
```

Передать собственный тип для подсказок можно при инициализации виджета, и этот тип будет распространен на все объекты подсказок в коллбэках и методах этого экземпляра.

```ts
interface AddressSuggestion {
    postal_code: string | null;
    kladr_id: string | null;
    ...
    history_values: string[] | null;
}

const input = document.getElementById("address") as HTMLInputElement;

const suggestions = createSuggestions<AddressSuggestion>(input, {
    type: "address",
    onSelect(suggestion) { // suggestion is Suggestion<AddressSuggestion>
        console.log(suggestion);
    }
});

suggestions.getSuggestions(); // вернет Suggestion<AddressSuggestion>[]
```

При изменении опций виджета можно передать новый тип, если нужно на лету изменить тип подсказок:

```ts
const suggestions = createSuggestions<AddressSuggestion>(input, options);

suggestions.setOptions<NameSuggestion>({
    type: "name",
    onSelect(suggestion) {
        // suggestion is Suggestion<NameSuggestion>
        console.log(suggestion);
    },
});
```

Методы `getSelection`, `getSuggestions` и `getOptions` - тоже позволяют изменить тип подсказки в возвращаемом значении:

```ts
const suggestions = createSuggestions<AddressSuggestion>(input, options);

suggestions.getSelection<NameSuggestion>(); // Suggestion<NameSuggestion>
suggestions.getSuggestions<EmailSuggestion>(); // Suggestion<EmailSuggestion>[]
suggestions.getOptions<PartySuggestion>(); // Options<PartySuggestion>
```

## Примеры использования

Исходники и демки доступны на платфоме Codepen по ссылкам ниже.

### Адреса

[Подсказки по адресу](https://codepen.io/dadata/pen/QwwLJoa?editors=1010)<br>
[Разложить адрес по полям](https://codepen.io/dadata/pen/ByyBMRE?editors=1010)<br>
[Муниципальное деление](https://codepen.io/dadata/pen/qEEWgXp?editors=1010)

Ограничение области поиска:

- [Ограничить сектор поиска по адресу](https://codepen.io/dadata/pen/PwwYVOL?editors=1010)
- [Адреса внутри окружности на карте](https://codepen.io/dadata/pen/PwwYVQg?editors=1010)
- [Только города](https://codepen.io/dadata/pen/wBBwNXw?editors=1010)
- [Иностранные города](https://codepen.io/dadata/pen/MYYWKMg?editors=1010)
- [Без земельных участков](https://codepen.io/dadata/pen/azzbdeZ?editors=1010)
- [Без станций метро](https://codepen.io/dadata/pen/KwwKVOL?editors=1010)

Подсказки по отдельным полям адреса (гранулярные подсказки):

- [Регион, город, улица, дом](https://codepen.io/dadata/pen/PwwoNNy?editors=1010)
- [Адрес до н/п одной строкой + улица и дом отдельно](https://codepen.io/dadata/pen/YPPzqpa?editors=1010)
- [Страна + остальной адрес отдельно](https://codepen.io/dadata/pen/XJJWdRN?editors=1010)
- [Все поля адреса](https://codepen.io/dadata/pen/EaaxKvW?editors=1010)

Форматирование:

- [Город и н/п без типов](https://codepen.io/dadata/pen/QwwWNJj?editors=1010)
- [Адрес в формате Почты России](https://codepen.io/dadata/pen/NPPWNVq?editors=1010)
- [Полные типы вместо сокращенных](https://codepen.io/dadata/pen/qEEBmvo?editors=1010)
- [Точки после сокращений](https://codepen.io/dadata/pen/azzbwZG?editors=1010)

Почтовый индекс:

- [Подставить индекс после выбора адреса](https://codepen.io/dadata/pen/vEEYZxq?editors=1010)
- [Определить город по индексу](https://codepen.io/dadata/pen/LEEYjKx?editors=1010)
- [Подсказки по индексу](https://codepen.io/dadata/pen/WbbNOmE?editors=1010)

Геолокация по IP:

- [Включить и отключить геолокацию](https://codepen.io/dadata/pen/pvvorMm?editors=1010)
- [Сохранить информацию о геолокации](https://codepen.io/dadata/pen/yyyLzBm?editors=1010)

Карты и доставка:

- [Выбрать адрес на карте](https://codepen.io/dadata/pen/WbbNZvm?editors=1010)
- [Показать адрес на карте (Яндекс)](https://codepen.io/dadata/pen/zxxYEpN?editors=1010)
- [Показать адрес на карте (Google)](https://codepen.io/dadata/pen/WbbNYzR?editors=1010)
- [Идентификатор города в службах доставки](https://codepen.io/dadata/pen/vEEYQVB?editors=1010)

Международные подсказки:

- [Подсказки на английском языке](https://codepen.io/dadata/pen/dPPyQQB?editors=1010)
- [Подсказки по всем странам](https://codepen.io/dadata/pen/MYYWKMg?editors=1010)
- [Подсказки по всем странам (гранулярные)](https://codepen.io/dadata/pen/xbbxmxe?editors=1010)
- [Подсказки по выбранным странам](https://codepen.io/dadata/pen/NPPWePv?editors=1010)
- [Города мира](https://codepen.io/dadata/pen/gbbOZaL?editors=1010)

Другие возможности:

- [Адрес по коду ФИАС или КЛАДР](https://codepen.io/dadata/pen/YPPzdQW?editors=1010)
- [Получить код регистрирующей налоговой по адресу](https://codepen.io/dadata/pen/raaNopb?editors=1010)
- [Предзаполнение сохраненного адреса (гранулярный)](https://codepen.io/dadata/pen/raaNodg?editors=1010)
- [Предзаполнение сохраненного адреса (одной строкой)](https://codepen.io/dadata/pen/gbbOZzx?editors=1010)
- [Запретить автоисправление](https://codepen.io/dadata/pen/yyyLGqZ?editors=1010)
- [Запретить вводить адрес без дома](https://codepen.io/dadata/pen/NPPWeEB?editors=1010)
- [Проверить заполненность адреса](https://codepen.io/dadata/pen/yyyLGZw?editors=1010)
- [Установка адреса через setSuggestion](https://codepen.io/dadata/pen/wBBvROX?editors=1010)

### Организации

[Подсказки по организациям](https://codepen.io/dadata/pen/WbbNLBa?editors=1010)

[Подсказки по ИНН](https://codepen.io/dadata/pen/qEEBgWa?editors=1010)<br>
[Заполнить реквизиты компании по ИНН](https://codepen.io/dadata/pen/bNNGzwO?editors=1010)

[Ограничить сектор поиска по организациям](https://codepen.io/dadata/pen/EaaxrZg?editors=1010)<br>
[Подсказки по организациям без филиалов](https://codepen.io/dadata/pen/PwwoVOx?editors=1010)<br>
[Фильтр по ОКВЭД](https://codepen.io/dadata/pen/XJJWOEN?editors=1010)

[Запретить автоисправление](https://codepen.io/dadata/pen/OPPJdvd?editors=1010)<br>
[Запретить вводить компанию, если ее нет в ЕГРЮЛ](https://codepen.io/dadata/pen/QwwWYBL?editors=1010)<br>
[Включить и отключить геолокацию](https://codepen.io/dadata/pen/OPPJdwq?editors=1010)

[Собственное сообщение, если компания не найдена](https://codepen.io/dadata/pen/oggNmPE?editors=1010)

### Банки

[Подсказки по банкам](https://codepen.io/dadata/pen/bNNGzOX?editors=1010)<br>
[Ограничить сектор поиска по банкам](https://codepen.io/dadata/pen/yyyLZwO?editors=1010)<br>
[Отфильтровать банки по городу](https://codepen.io/dadata/pen/YPPzBgO?editors=1010)<br>
[Заполнить реквизиты банка по БИК](https://codepen.io/dadata/pen/PwwoVrv?editors=1010)

### ФИО

[Подсказки по ФИО](https://codepen.io/dadata/pen/azzbMoV?editors=1010)<br>
[Разложить ФИО по полям](https://codepen.io/dadata/pen/EaaxMab?editors=1010)<br>
[Гранулярные подсказки ФИО](https://codepen.io/dadata/pen/zxxYbGE?editors=1010)

### Паспорт

[Кем выдан паспорт (только наименование)](https://codepen.io/dadata/pen/ByyabKa?editors=1010)<br>
[Кем выдан паспорт (код + наименование)](https://codepen.io/dadata/pen/YPPzgqd?editors=1010)

### Email

[Подсказки по email](https://codepen.io/dadata/pen/qEEBvNy?editors=1010)<br>
[Подсказывать только домен](https://codepen.io/dadata/pen/QwwWoKE?editors=1010)

### Прочее

[Включить или отключить подсказки](https://codepen.io/dadata/pen/YPPzgQM?editors=1010)<br>
[Изменить количество подсказок](https://codepen.io/dadata/pen/raaNRzp?editors=1010)<br>
[Подсказки с 3-го символа](https://codepen.io/dadata/pen/oggNVGJ?editors=1010)

[Обработчик onSelectNothing](https://codepen.io/dadata/pen/jEEOJay?editors=1010)<br>
[Сообщение пользователю, если подсказки не работают](https://codepen.io/dadata/pen/myydopb?editors=1010)

[Мобильная версия подсказок](https://codepen.io/dadata/pen/RNNwdxX?editors=1010)
