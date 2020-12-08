import Popover from "../Popover";
import { highlightMatches } from "../../utils/highlightMatches";
import { Suggestion, Suggestions } from "../../types";
import { isMobileViewport } from "../../utils/isMobileViewport";
import { isCursorAtEnd, setCursorAtEnd } from "../../utils/cursor";
import { scrollToTop } from "../../utils/scrollToTop";
import ImplementationSuggestionsBase from "./ImplementationSuggestionsBase";
import { EVENT_INPUT_CHANGE } from "../Input";
import { hasQualityCode } from "../../utils/suggestion";
import { ImplementationBaseOptions } from "./ImplementationBase";
import { deepEqual } from "../../utils/deepEqual";
import { noop } from "../../utils/noop";
import { invoke } from "../../utils/invoke";

enum PopoverState {
  CLOSED,
  OPENING, // data is fetching
  OPEN,
  SELECTING, // suggestion is enriching
}

export default class ImplementationSuggest<
  SuggestionData
> extends ImplementationSuggestionsBase<SuggestionData> {
  private popoverState: PopoverState = PopoverState.CLOSED;
  private popover: Popover | null = null;
  private suggestions: Suggestions<SuggestionData> = [];
  private highlightIndex = -1;
  private shouldIgnoreBlur = false;

  constructor(
    el: HTMLInputElement,
    options: ImplementationBaseOptions<SuggestionData>
  ) {
    super(el, options);
    this.fetchSuggestionApiMethod = "suggest";
    this.listenToInput();
    this.listenToHelpersElements();
  }

  private highlightNext() {
    const { length } = this.suggestions;

    if (length) {
      const index = this.highlightIndex;
      this.setHighlightIndex(index < length - 1 ? index + 1 : 0);
    }
  }

  private highlightPrev() {
    const { length } = this.suggestions;

    if (length) {
      const index = this.highlightIndex;
      this.setHighlightIndex(index > 0 ? index - 1 : length - 1);
    }
  }

  private setHighlightIndex(index: number) {
    const { input } = this.options;

    this.highlightIndex = index;

    if (index >= 0) {
      const suggestion = this.suggestions[index];

      if (input.getValue().trim() !== suggestion.value) {
        input.suggestValue(suggestion.value);
      }

      this.popover?.highlightItem(index);
    } else {
      input.suggestValue(null);
    }
  }

  private getMatchedHighlightIndex(): number {
    if (this.suggestions.length) {
      const currentSuggestion = this.getCurrentSuggestion();

      if (currentSuggestion) {
        const sameAsCurrentSuggestion = this.suggestions.find((suggestion) =>
          deepEqual(suggestion, currentSuggestion)
        );

        if (sameAsCurrentSuggestion) {
          return this.suggestions.indexOf(sameAsCurrentSuggestion);
        }
      }

      const currentValue = this.options.input.getValue().trim();
      const matchedWithCurrentValue = this.suggestions.find(
        (suggestion) => suggestion.value === currentValue
      );

      if (matchedWithCurrentValue) {
        return this.suggestions.indexOf(matchedWithCurrentValue);
      }

      if (this.options.autoHighlightFirst) return 0;
    }

    return -1;
  }

  private listenToInput() {
    const {
      input,
      helperElements,
      mobileMaxWidth,
      scrollOnFocus,
      triggerSelectOnBlur,
      triggerSelectOnEnter,
      triggerSelectOnSpace,
    } = this.options;

    const handleChange = () => {
      // Invalidate current selection
      if (this.getCurrentSuggestion()) {
        this.setCurrentSuggestion(null);
      }

      this.updatePopover();
    };

    const handleKeydown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          switch (this.popoverState) {
            case PopoverState.CLOSED:
              this.updatePopover();
              break;
            case PopoverState.OPEN:
              this.highlightNext();
              break;
          }
          break;

        case "ArrowUp":
          e.preventDefault();
          if (this.popoverState === PopoverState.OPEN) {
            this.highlightPrev();
          }
          break;

        case "Escape":
          if (this.popoverState === PopoverState.OPEN) {
            this.disposePopover();
          }
          break;

        case "Enter":
          if (triggerSelectOnEnter && this.popoverState === PopoverState.OPEN) {
            e.preventDefault();
            this.select(this.highlightIndex);
          }
          break;

        case " ":
          if (
            triggerSelectOnSpace &&
            isCursorAtEnd(this.el, true) &&
            this.popoverState === PopoverState.OPEN
          ) {
            e.preventDefault();
            this.select(this.highlightIndex, { continueSelecting: true });
          }
          break;
      }
    };

    const handleFocus = () => {
      if (this.popoverState === PopoverState.CLOSED) {
        this.updatePopover();
      }

      if (isMobileViewport(window, mobileMaxWidth)) {
        setCursorAtEnd(this.el);
        if (scrollOnFocus) scrollToTop(this.el);
      }
    };

    const handleBlur = (e: FocusEvent) => {
      const { relatedTarget } = e;
      const shouldIgnore =
        this.shouldIgnoreBlur ||
        // Ignore blur when focusing one of helperElements
        (helperElements &&
          relatedTarget instanceof Element &&
          Array.from(helperElements).some(
            (helperElement) =>
              helperElement === relatedTarget ||
              helperElement.contains(relatedTarget)
          ));

      if (!shouldIgnore) {
        if (
          triggerSelectOnBlur &&
          this.popoverState !== PopoverState.OPENING &&
          this.popoverState !== PopoverState.SELECTING &&
          this.isQueryRequestable(input.getValue().trim())
        ) {
          this.select(this.highlightIndex);
        }

        this.disposePopover();
      }

      this.shouldIgnoreBlur = false;
    };

    this.addDisposableEventListener(this.el, EVENT_INPUT_CHANGE, handleChange);
    this.addDisposableEventListener(this.el, "keydown", handleKeydown);
    this.addDisposableEventListener(this.el, "focus", handleFocus);
    this.addDisposableEventListener(this.el, "blur", handleBlur);
  }

  private listenToHelpersElements() {
    const { helperElements } = this.options;

    if (helperElements) {
      // Ignore blur when helperElements clicked
      this.addDisposableEventListener(
        document,
        "mousedown",
        (e: MouseEvent) => {
          const { target } = e;

          if (
            target instanceof Element &&
            Array.from(helperElements).some(
              (helperElement) =>
                helperElement === target || helperElement.contains(target)
            )
          ) {
            this.ignoreNextBlur();
          }
        }
      );
    }
  }

  private setPopoverState(popoverState: PopoverState) {
    this.popoverState = popoverState;
  }

  private updatePopover() {
    const query = this.options.input.getValue().trim();

    if (this.isQueryRequestable(query)) {
      this.updateSuggestions(query);
    } else {
      this.disposePopover();
    }
  }

  private initPopover(items: string[]) {
    this.popover = new Popover(this.el, {
      ...this.options,
      showPromo: this.options.plan === "FREE",
      items,
      onMousedown: () => this.ignoreNextBlur(),
      onItemClick: (index: number) => {
        // Focusing should be before starting selecting to avoid re-showing popover
        this.el.focus();

        if (this.popoverState === PopoverState.OPEN) {
          this.select(index);
        }
      },
    });
    this.setPopoverState(PopoverState.OPEN);
    this.setHighlightIndex(this.getMatchedHighlightIndex());
    this.onDispose(() => this.disposePopover());
  }

  private disposePopover() {
    if (this.popover) {
      this.popover.dispose();
      this.popover = null;
      this.setPopoverState(PopoverState.CLOSED);
      this.setHighlightIndex(-1);
    }
  }

  private ignoreNextBlur() {
    this.shouldIgnoreBlur = true;
  }

  /**
   * Fetch suggestions and pass them to popover
   */
  private updateSuggestions(query: string) {
    const { renderSuggestion, unformattableTokens } = this.options;

    if (this.popoverState === PopoverState.CLOSED) {
      this.setPopoverState(PopoverState.OPENING);
    }

    this.fetchSuggestions(query)
      .then((suggestions) => {
        this.suggestions = suggestions;

        // List contains only one suggestion, matching a current
        if (
          this.popoverState === PopoverState.OPEN &&
          suggestions.length === 1 &&
          deepEqual(suggestions[0], this.getCurrentSuggestion())
        ) {
          this.disposePopover();
          return;
        }

        const suggestionHtmls: string[] = suggestions.map((suggestion) => {
          const { value } = suggestion;

          return (
            invoke(renderSuggestion, suggestion, query, {
              suggestions,
              unformattableTokens,
            }) || highlightMatches(value, query, { unformattableTokens })
          );
        });

        if (this.popover) {
          this.popover.setItems(suggestionHtmls);
          this.setHighlightIndex(this.getMatchedHighlightIndex());
        } else {
          this.initPopover(suggestionHtmls);
        }
      })
      .catch(noop);
  }

  /**
   * Starts the process of selecting, that can include enrichment.
   * @param {number} index can be -1
   * @param {object} [options]
   * @param {boolean} [options.continueSelecting]
   */
  private select(index: number, options?: { continueSelecting: boolean }) {
    const {
      input,
      formatSelected,
      isSuggestionDataComplete,
      enrichmentEnabled,
    } = this.options;

    const selectedSuggestion: Suggestion<SuggestionData> | null =
      this.suggestions[index] || null;

    // Do not let select current suggestion again.
    // Comparing by reference can not work because suggestion could be fetched in different requests.
    if (
      selectedSuggestion &&
      deepEqual(selectedSuggestion, this.getCurrentSuggestion())
    ) {
      if (options?.continueSelecting) {
        input.setValue(`${input.getValue()} `);
      } else {
        if (this.popoverState === PopoverState.OPEN) {
          this.disposePopover();
        }
      }
      return;
    }

    // Selection can happen with closed popover
    if (this.popoverState === PopoverState.OPEN) {
      this.setPopoverState(PopoverState.SELECTING);
    }

    const selectedSuggestionValue: string | null =
      selectedSuggestion &&
      (invoke(formatSelected, selectedSuggestion) || selectedSuggestion.value);

    // Enrichment can take a long time, so update input's value before it.
    if (selectedSuggestion) {
      input.setValue(selectedSuggestionValue);
    }

    new Promise<Suggestion<SuggestionData> | null>((resolve, reject) => {
      if (
        selectedSuggestion &&
        !hasQualityCode(selectedSuggestion.data) &&
        enrichmentEnabled &&
        !options?.continueSelecting
      ) {
        resolve(this.fetchSuggestion(selectedSuggestion.unrestricted_value));
      } else {
        reject();
      }
    })
      // If enrichment was not used or failed, continue with original suggestion
      .catch(() => selectedSuggestion)
      // If enrichment request returned empty list, continue with original suggestion
      .then((enrichedSuggestion) => enrichedSuggestion || selectedSuggestion)
      .then((enrichedSuggestion: Suggestion<SuggestionData> | null) => {
        this.setCurrentSuggestion(enrichedSuggestion);

        // Save enriched suggestion into the cache
        if (enrichedSuggestion) {
          this.suggestions[index] = enrichedSuggestion;
        }

        const shouldContinueSelecting: boolean =
          Boolean(options?.continueSelecting) &&
          // Suppose suggestion is complete enough and there is no need to continue selecting
          !(
            enrichedSuggestion &&
            invoke(isSuggestionDataComplete, enrichedSuggestion)
          );

        // If value has not changed during enrichment, update input
        // Also add a trailing  space if needed
        const currentValue = input.getValue().trim();

        if (
          selectedSuggestionValue === null ||
          currentValue === selectedSuggestionValue
        ) {
          const nextValue = enrichedSuggestion
            ? invoke(formatSelected, enrichedSuggestion) ||
              enrichedSuggestion.value
            : currentValue;

          input.setValue(`${nextValue}${shouldContinueSelecting ? " " : ""}`);
        }

        if (shouldContinueSelecting) {
          // Return popoverState to OPEN if popover exists
          if (this.popoverState === PopoverState.SELECTING) {
            this.setPopoverState(PopoverState.OPEN);
          }

          this.updatePopover();
        } else {
          // Popover can be closed by blur and open again during enrichment
          if (this.popoverState === PopoverState.SELECTING) {
            this.disposePopover();
          }
        }
      });
  }
}
