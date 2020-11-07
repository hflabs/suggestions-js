
## Classes inheritance hierarchy:

```
- Api -- responsible for working with backend. Handles all the low-level stuff with headers, request parameters, timeout etc.
- Disposable -- provides internal methods for neat cleanup on class disposing.
  |- Floater -- takes care of positioning a dropdown at the bottom edge of the text-field.
  |- Input -- enhance the text-field for working as plugin's main element.
  |- Popover -- manages the content of dropdown: rendering suggestions, highlighting, showing hints, promo etc.
  |- Suggestions -- the main entity that is created by entry-points. It is a kind of wrapper for Implementations (see below).
  |- Implementations/ImplementationBase -- can fetch one suggestion, trigger selection-related callbacks
     |- Implementations/ImplementationFindById -- implements "findById" mode
     |- Implementations/ImplementationSuggestionsBase -- can fetch a list of suggestions. It uses cache.
        |- Implementations/ImplementationSuggest -- adds dropdown and all the selecting features.
```

## Classes dependencies:

1. Entry-point creates Suggestions instance.
2. Suggestion creates Api and Input.
3. Once text-field is observed as visible, Suggestions create an appropriate Implementation.
4. Implementation, if it is a ImplementationSuggest, can create Popover when a dropdown is needed.
5. Popover instantiate Floater.
