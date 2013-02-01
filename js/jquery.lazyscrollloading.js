/**
 * @preserve jQuery Lazy Scroll Loading Plugin %Revision%
 * 
 * https://code.google.com/p/jquerylazyscrollloading/
 * 
 * Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
 * 
 * @author Dreamltf
 * @date %BuiltDate%
 * 
 * Depends: jquery.js (1.2+)
 */
(function($) {
	/* static variables */
	var PLUGIN_NAMESPACE = "LazyScrollLoading";
	var PLUGIN_LAZYIMAGE_ATTR = "lazy-img";
	/* default options */
	var defaultOptions = {
		isDefaultLazyImageMode : false,
		lazyItemSelector : null,
		delay : 500,
		/* callback function */
		onCreate : null,
		onLazyItemFirstVisible : null,
		onLazyItemVisible : null,
		onScrollToTop : null,
		onScrollToBottom : null,
		onScrollToLeftmost : null,
		onScrollToRightmost : null
	};

	/**
	 * Public Method
	 */
	$.extend($.fn, {
		/**
		 * Public : Main method
		 * 
		 * @param options
		 *            Object
		 * @return jQuery
		 */
		lazyScrollLoading : function(options) {
			options = $.extend({}, defaultOptions, options);
			/* correct options */
			if (options.isDefaultLazyImageMode && !options.lazyItemSelector) {
				options.lazyItemSelector = "img[" + PLUGIN_LAZYIMAGE_ATTR + "]:not([src])";
			}
			/* starting */
			return this.each(function() {
				var $container = $(this);
				/* destroy */
				$container.destroyLazyScrollLoading();
				/* prepare options */
				$container.data("options." + PLUGIN_NAMESPACE, options);
				/* initialize */
				initializeLazyScrollLoading($container, options);
				/* trigger event */
				if (options.onCreate) {
					options.onCreate.apply($container[0]);
				}
			});
		},

		/**
		 * Public : Get container's options
		 * 
		 * @return Object
		 */
		getLazyScrollLoadingOptions : function() {
			return this.data("options." + PLUGIN_NAMESPACE);
		},

		/**
		 * Public : Get container's scroll history
		 * 
		 * @return Object
		 */
		getLazyScrollLoadingScrollHistory : function() {
			return this.data("scrollHistory." + PLUGIN_NAMESPACE);
		},

		/**
		 * Public : Get container or lazyItem's viewport
		 * 
		 * @return Object
		 */
		getLazyScrollLoadingViewport : function() {
			var $container = this;
			var container = $container[0];
			var containerOffset = $container.offset();
			var $window = $(window);
			var $document = $(document);
			var isRoot = isRootContainer(container);
			return {
				scrollLeft : function(value) {
					return (isRoot ? $window : $container).scrollLeft(value);
				},
				scrollTop : function(value) {
					return (isRoot ? $window : $container).scrollTop(value);
				},
				getScrollBindTarget : function() {
					return (isRoot ? $document : $container);
				},
				getWidth : function(isOuterOrInner) {
					return (isRoot ? $window.width() : (isOuterOrInner ? $container.outerWidth() : $container.innerWidth()));
				},
				getHeight : function(isOuterOrInner) {
					return (isRoot ? $window.height() : (isOuterOrInner ? $container.outerHeight() : $container.innerHeight()));
				},
				getScrollWidth : function() {
					return (isRoot ? $document.width() : container.scrollWidth);
				},
				getScrollHeight : function() {
					return (isRoot ? $document.height() : container.scrollHeight);
				},
				getLeftPos : function() {
					return (isRoot ? $window.scrollLeft() : containerOffset.left);
				},
				getTopPos : function() {
					return (isRoot ? $window.scrollTop() : containerOffset.top);
				},
				getRightPos : function() {
					return this.getLeftPos() + this.getWidth(true);
				},
				getBottomPos : function() {
					return this.getTopPos() + this.getHeight(true);
				},
				isVerticalScrollBarVisible : function() {
					return (this.getHeight(false) < this.getScrollHeight());
				},
				isHorizontalScrollBarVisible : function() {
					return (this.getWidth(false) < this.getScrollWidth());
				},
				isVerticalScrollBarScrolling : function() {
					if (!this.isVerticalScrollBarVisible()) {
						return false;
					}
					var containerScrollHistory = $container.getLazyScrollLoadingScrollHistory();
					return (!containerScrollHistory || containerScrollHistory.scrollTop != this.scrollTop());
				},
				isHorizontalScrollBarScrolling : function() {
					if (!this.isHorizontalScrollBarVisible()) {
						return false;
					}
					var containerScrollHistory = $container.getLazyScrollLoadingScrollHistory();
					return (!containerScrollHistory || containerScrollHistory.scrollLeft != this.scrollLeft());
				},
				isScrollToTop : function() {
					if (!this.isVerticalScrollBarVisible()) {
						return false;
					}
					return (this.scrollTop() <= 0);
				},
				isScrollToBottom : function() {
					if (!this.isVerticalScrollBarVisible()) {
						return false;
					}
					return (this.scrollTop() >= this.getScrollHeight() - this.getHeight(false));
				},
				isScrollToLeftmost : function() {
					if (!this.isHorizontalScrollBarVisible()) {
						return false;
					}
					return (this.scrollLeft() <= 0);
				},
				isScrollToRightmost : function() {
					if (!this.isHorizontalScrollBarVisible()) {
						return false;
					}
					return (this.scrollLeft() >= this.getScrollWidth() - this.getWidth(false));
				}
			};
		},

		/**
		 * Public : Get container's cached lazy items
		 * 
		 * @param isReNew
		 *            boolean
		 * @param selector
		 *            String
		 * @return jQuery
		 */
		getLazyScrollLoadingCachedLazyItems : function(isReNew, selector) {
			return this.pushStack($.map(this, function(container) {
				var $container = $(container);
				var options = $container.getLazyScrollLoadingOptions();
				var $lazyItems = $container.data("items." + PLUGIN_NAMESPACE);
				if (options && options.lazyItemSelector && (isReNew || !$lazyItems)) {
					/* cache lazy items if necessary */
					$lazyItems = $(options.lazyItemSelector, (isRootContainer(container) ? undefined : $container));
					$container.data("items." + PLUGIN_NAMESPACE, $lazyItems);
				}
				if ($lazyItems && selector) {
					$lazyItems = $lazyItems.filter(selector);
				}
				return ($lazyItems != null ? $lazyItems.get() : null);
			}));
		},

		/**
		 * Public : Destroy LazyScrollLoading
		 * 
		 * @return jQuery
		 */
		destroyLazyScrollLoading : function() {
			/* yield event handler */
			return this.each(function() {
				var $container = $(this);
				/* reset event handler */
				$container.getLazyScrollLoadingViewport().getScrollBindTarget().unbind("scroll." + PLUGIN_NAMESPACE);
				/* clear cache */
				$container.getLazyScrollLoadingCachedLazyItems().removeData("isLoaded." + PLUGIN_NAMESPACE);
				$container.removeData("items." + PLUGIN_NAMESPACE).removeData("scrollHistory." + PLUGIN_NAMESPACE).removeData("options." + PLUGIN_NAMESPACE);
			});
		},

		/**
		 * Public : Is lazy item loaded
		 * 
		 * @return boolean
		 */
		isLazyScrollLoadingLazyItemLoaded : function() {
			return (this.data("isLoaded." + PLUGIN_NAMESPACE) === true);
		},

		/**
		 * Public : Is lazy item visible
		 * 
		 * @param $container
		 *            jQuery
		 * @return boolean
		 */
		isLazyScrollLoadingLazyItemVisible : function($container) {
			var lazyItemViewport = this.getLazyScrollLoadingViewport();
			var containerViewport = $container.getLazyScrollLoadingViewport();
			/* calculate isVisible by position */
			return (lazyItemViewport.getBottomPos() > containerViewport.getTopPos() && lazyItemViewport.getLeftPos() < containerViewport.getRightPos() && lazyItemViewport.getTopPos() < containerViewport.getBottomPos() && lazyItemViewport.getRightPos() > containerViewport.getLeftPos());
		}
	});

	/**
	 * Private : Is Root Container
	 */
	function isRootContainer(container) {
		return (container == window || container == document || container == document.body);
	}

	/**
	 * Private : Initialize LazyScrollLoading
	 */
	function initializeLazyScrollLoading($container, options) {
		var $lazyItems = $container.getLazyScrollLoadingCachedLazyItems();
		var containerViewport = $container.getLazyScrollLoadingViewport();
		var $scrollBindTarget = containerViewport.getScrollBindTarget();
		/* starting */
		var isTimerOn = false;
		var timer = null;
		$scrollBindTarget.bind("scroll." + PLUGIN_NAMESPACE, function(e) {
			if (options.delay <= 0) {
				fireOnScrollEvent(e, $container, options, $lazyItems);
			} else if (!isTimerOn) {
				isTimerOn = true;
				if (timer != null) {
					clearTimeout(timer);
				}
				timer = setTimeout(function() {
					fireOnScrollEvent(e, $container, options, $lazyItems);
					/* clear timer */
					clearTimeout(timer);
					isTimerOn = false;
				}, options.delay);
			}
		});
		/* on first window loaded, for visible element only */
		/* IE version < 9 would not be triggered the onscroll event */
		if ((containerViewport.scrollTop() <= 0 && containerViewport.scrollLeft() <= 0) || ($.browser.msie && $.browser.version < 9)) {
			$scrollBindTarget.trigger("scroll." + PLUGIN_NAMESPACE);
		}
	}

	/**
	 * Private : Fire OnScroll Event
	 */
	function fireOnScrollEvent(e, $container, options, $lazyItems) {
		var container = $container[0];
		var lazyItemVisibleArray = [];
		var lazyItemFirstVisibleArray = [];
		if (options.lazyItemSelector) {
			if (options.isDefaultLazyImageMode || options.onLazyItemFirstVisible || options.onLazyItemVisible) {
				$lazyItems.each(function() {
					var $lazyItem = $(this);
					/* is lazy item visible */
					if ($lazyItem.isLazyScrollLoadingLazyItemVisible($container)) {
						lazyItemVisibleArray.push(this);
						if (!$lazyItem.isLazyScrollLoadingLazyItemLoaded()) {
							$lazyItem.data("isLoaded." + PLUGIN_NAMESPACE, true);
							lazyItemFirstVisibleArray.push(this);
						}
					}
				});
			}
			/* lazy image mode */
			if (options.isDefaultLazyImageMode) {
				for ( var i = 0, lazyItemFirstVisibleArraySize = lazyItemFirstVisibleArray.length; i < lazyItemFirstVisibleArraySize; i++) {
					var lazyImageItem = lazyItemFirstVisibleArray[i];
					lazyImageItem.src = lazyImageItem.getAttribute(PLUGIN_LAZYIMAGE_ATTR);
				}
			}
		}
		/* trigger callback */
		if (options.onScrollToTop || options.onScrollToBottom || options.onScrollToLeftmost || options.onScrollToRightmost) {
			/* keep the old scrollTop and scrollLeft */
			var containerViewport = $container.getLazyScrollLoadingViewport();
			var newScrollHistory = {
				scrollTop : containerViewport.scrollTop(),
				scrollLeft : containerViewport.scrollLeft()
			};
			if (containerViewport.isVerticalScrollBarScrolling()) {
				if (options.onScrollToTop && containerViewport.isScrollToTop()) {
					options.onScrollToTop.apply(container, [ e, $lazyItems ]);
				}
				if (options.onScrollToBottom && containerViewport.isScrollToBottom()) {
					options.onScrollToBottom.apply(container, [ e, $lazyItems ]);
				}
			}
			if (containerViewport.isHorizontalScrollBarScrolling()) {
				if (options.onScrollToLeftmost && containerViewport.isScrollToLeftmost()) {
					options.onScrollToLeftmost.apply(container, [ e, $lazyItems ]);
				}
				if (options.onScrollToRightmost && containerViewport.isScrollToRightmost()) {
					options.onScrollToRightmost.apply(container, [ e, $lazyItems ]);
				}
			}
			/* reset the scrollbar after event triggered */
			containerViewport.scrollTop(newScrollHistory.scrollTop);
			containerViewport.scrollLeft(newScrollHistory.scrollLeft);
			/* reset history */
			$container.data("scrollHistory." + PLUGIN_NAMESPACE, newScrollHistory);
		}
		if (options.onLazyItemVisible && lazyItemVisibleArray.length > 0) {
			options.onLazyItemVisible.apply(container, [ e, $lazyItems, $container.pushStack(lazyItemVisibleArray) ]);
		}
		if (options.onLazyItemFirstVisible && lazyItemFirstVisibleArray.length > 0) {
			options.onLazyItemFirstVisible.apply(container, [ e, $lazyItems, $container.pushStack(lazyItemFirstVisibleArray) ]);
		}
	}

})(jQuery);