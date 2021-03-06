/*
//	jQuery viewPointPubSub viewpoint
//	adamchow2326@yahoo.com.au
//	
//	bind element to detect if it is in viewpoint when on DOM ready, window scroll and window resize.
//	The plugin will trigger a each supplied callback when element is:
//	'inView', 'offView', 'offTop', 'offRight', 'offBottom', 'offLeft', 'affixTop', 'offAffixTop'
*/

(function($, document, window) {
	"use strict";
    
	var viewpoint,
        pluginName = "viewpoint",
        version = "1.1.0",
        defaultOptions = {
            scrollElement: window,
            contentPane: null,
            eventCheckViewPoint: "checkViewPoint",
            eventNamespace: ".viewpoint",
            inView: undefined,
            offView: undefined,
            offTop: undefined,
            offRight: undefined,
            offBottom: undefined,
            offLeft: undefined,
            topOffset: undefined, // threshold for detection 
            rightOffset: undefined,
            bottomOffset: undefined,
            leftOffset: undefined,
            affixOffset: undefined,
            affixTop: undefined,
            offAffixTop: undefined,
			//autoTriggerInView: true, // flag if trigger in view event even element is not fully in view
			//autoTriggerThreshold: 10, // minimum threshold autoTriggerInView detection
            delay: 70
        };

    function isNumeric(obj) {
        return obj - parseFloat(obj) >= 0;
    }
    // check str is '[number]%' otherwiser return false
    function isPercent(str) {
        var ret = false,
        percentChar = "%";
        if(typeof str === "string") {
            if (str.charAt(str.length - 1) === percentChar) {;
                ret = str.substring(0, str.length - 1);
                return isNumeric(ret) ? ret : false;
            }
        }
        return ret;
    }
	
	function Viewpoint(element, opt) {
		// check if opt define any function
		this.constructor = Viewpoint;
		if (element && $.isPlainObject(opt)) {
			if ($.isFunction(opt.inView) || 
			$.isFunction(opt.offView) || 
			$.isFunction(opt.offTop) || 
			$.isFunction(opt.offRight) || 
			$.isFunction(opt.offBottom) ||
			$.isFunction(opt.offLeft) ||
			$.isFunction(opt.affixTop) ||
			$.isFunction(opt.offAffixTop)) {
				this.options = $.extend({}, defaultOptions, opt);
			} else {
				return;
			}
			return this.init(element);
		}
	}
    
    Viewpoint.prototype = {
		sWindow: null,
		isCalled: "",
		isAffixTopCalled: "",
		isDisable: false,
		currentState: {},
		
        init: function (element) {
			var self = this;
			self.sWindow = $(self.options.scrollElement);	
			// check if window or detect scroll element exits and is scrollable
			if (!self.sWindow.length) {
				throw "scrollElement not found";
			}
			if (typeof self.options.contentPane === "string") {
				self.$contentPane = $(self.options.contentPane);
				if (!self.$contentPane.length) {
					throw "contentPane not found";
				}
			}
			self.element = element;
			self.$element = $(element);
			self.setupEvents();
        },
		
		setupEvents: function() {
			var self = this,
				triggerCheckViewpoint,
				onAffixTop,
				offAffixTop,
				onInView,
				offView,
				debounceScrollTimer = null,
				debounceResizeTimer = null;
			
			// bind "checkViewPoint" event and check if element in viewpoint
			// flag isCalled to called relevant callbacks
			self.$element.on(self.options.eventCheckViewPoint, function(eData){
				// update current state
				self.updateCurrentState();
				// check affixTop	
				if (self.options.affixTop && self.currentState.isAffixTop) { 
					onAffixTop();
				} else if (self.options.offAffixTop) {
					offAffixTop();
				}		
				// check in viewpoint
				if (self.isInViewPoint()) {
					onInView();
				} else {
					offView();
				}
			});
			
			onAffixTop = function() {
				if(self.isAffixTopCalled !== "affixTop") {
					self.options.affixTop(self.$element, self.currentState);
					self.isAffixTopCalled = "affixTop";
				}
			};
			
			offAffixTop = function() {
				if (self.isAffixTopCalled !== "offAffixTop") {
					self.options.offAffixTop(self.$element, self.currentState);
					self.isAffixTopCalled = "offAffixTop";
				}
			};
			
			onInView = function() {
				if (self.options.inView && self.isCalled !== "inView") {
					self.options.inView(self.$element, self.currentState);
					self.isCalled = "inView";
				}
			};
			
			offView = function() {
				if (self.options.offView) {
					if (self.isCalled !== "offView"){
						self.options.offView(self.$element, self.currentState);
						self.isCalled = "offView";
					}
				}
				if (self.options.offTop && self.currentState.isOffTop) {
					if (self.isCalled !== "offTop"){
						self.options.offTop(self.$element, self.currentState);
						self.isCalled = "offTop";
					}
				}
				if (self.options.offRight && self.currentState.isOffRight) {
					if (self.isCalled !== "offRight"){
						self.options.offRight(self.$element, self.currentState);
						self.isCalled = "offRight";
					}
				}
				if (self.options.offBottom && self.currentState.isOffBottom) {
					if (self.isCalled !== "offBottom"){
						self.options.offBottom(self.$element, self.currentState);
						self.isCalled = "offBottom";
					}
				}
				if (self.options.offLeft && self.currentState.isOffLeft) {
					if (self.isCalled !== "offLeft"){
						self.options.offLeft(self.$element, self.currentState);
						self.isCalled = "offLeft";
					}
				}
			};
			// shortcut 
			triggerCheckViewpoint = function(event) {
				self.$element.trigger({
					type: self.options.eventCheckViewPoint,
					eData: event
				});
			};
			
			// bind document ready to check on first load
			$(document).ready(function(event){
				if (self.isDisable) {
					return;
				}
				triggerCheckViewpoint(event);
			});
			
			// bind window scroll event and trigger "sWindowscroll" event
			self.sWindow.on(("scroll" + self.options.eventNamespace), function(event){
				if (self.isDisable) {
					return;
				}
				clearTimeout(debounceScrollTimer);
				debounceScrollTimer = setTimeout(function(event) {
					triggerCheckViewpoint(event);
				}, self.options.delay);
			});
			
			// update sWindow size variable on window resize
			self.sWindow.on(("resize" + self.options.eventNamespace), function(event){
				if (self.isDisable) {
					return;
				}
				clearTimeout(debounceScrollTimer);
				debounceResizeTimer = setTimeout(function(event) {
					triggerCheckViewpoint(event);
				}, self.options.delay);
			});
			return this;
		},
		
		updateCurrentState: function() {
			var self = this,
				$elementPos = (self.$contentPane) ? self.$element.position() : self.$element.offset();
			
			self.currentState.winWidth = self.sWindow.width();
			self.currentState.winHeight = self.sWindow.height();
			self.currentState.winScrollTop = self.sWindow.scrollTop();
			self.currentState.winScrollLeft = self.sWindow.scrollLeft();
			self.currentState.elementWidth = self.$element.width();
			self.currentState.elementHeight = self.$element.height();
			self.currentState.elementOffsetTop = $elementPos.top;
			self.currentState.elementOffsetLeft = $elementPos.left;
			self.currentState.foldWidth = self.currentState.winWidth + self.currentState.winScrollLeft;
			self.currentState.foldHeight = self.currentState.winHeight + self.currentState.winScrollTop;
			self.currentState.isAffixTop = self.checkAffixTop();
		},
        
		// check if element in viewpoint and update currentState
		isInViewPoint: function() {
			var self = this;
				
			self.currentState.isOffTop = self.checkOffTop();
			self.currentState.isOffRight = self.checkOffRight();
			self.currentState.isOffBottom = self.checkOffBottom();
			self.currentState.isOffLeft = self.checkOffLeft();
			self.currentState.isInViewPoint = (!self.currentState.isOffTop && !self.currentState.isOffRight && !self.currentState.isOffBottom && !self.currentState.isOffLeft);

			return self.currentState.isInViewPoint;
		},
		
		checkOffTop: function() {
			var self = this,
                offsetPercentNum = isPercent(self.options.topOffset),
                offset = 0;
            if (typeof self.options.topOffset === "number") {
                offset = self.options.topOffset;
            } else if (offsetPercentNum !== false) {
                offset = self.currentState.elementHeight * (Number(offsetPercentNum) / 100);
            }
			return self.currentState.winScrollTop >= ((self.currentState.elementOffsetTop + self.currentState.elementHeight) - offset);
		},
		
		checkOffRight: function() { 
			var self = this,
                offsetPercentNum = isPercent(self.options.rightOffset),
                offset = 0;
            if (typeof self.options.rightOffset === "number") {
                offset = self.options.rightOffset;
            } else if (offsetPercentNum !== false) {
                offset = 0 - (self.currentState.elementWidth * (Number(offsetPercentNum) / 100));
            }
			return self.currentState.foldWidth <= (self.currentState.elementOffsetLeft - offset);
		},
		
		checkOffBottom: function() {
			var self = this,
                offsetPercentNum = isPercent(self.options.bottomOffset),
                offset = 0;
            if (typeof self.options.bottomOffset === "number") {
                offset = self.options.bottomOffset;
            } else if (offsetPercentNum !== false) {
                offset = 0 - (self.currentState.elementHeight * (Number(offsetPercentNum) / 100));
            }
			return self.currentState.foldHeight <= (self.currentState.elementOffsetTop - offset);
		},
		
		checkOffLeft: function() {
			var self = this,
                offsetPercentNum = isPercent(self.options.leftOffset),
                offset = 0;
            if (typeof self.options.leftOffset === "number") {
                offset = self.options.leftOffset;
            } else if (offsetPercentNum !== false) {
                offset = self.currentState.elementWidth * (Number(offsetPercentNum) / 100);
            }
			return self.currentState.winScrollLeft >= ((self.currentState.elementOffsetLeft + self.currentState.elementWidth) - offset);
		},
		
		checkAffixTop: function() {
			var self = this,
                offset = (typeof self.options.affixOffset === "number" ) ? self.options.affixOffset : 0;
			return self.currentState.winScrollTop >= (self.currentState.elementOffsetTop - offset);
		},
		
        reset: function(opt) {
            var self = this;
            self.isCalled = (opt && opt.isCalled === false) ? "" : self.isCalled;
            self.isAffixTopCalled = (opt && opt.isAffixTopCalled === false) ? "" : self.isAffixTopCalled;
        },
		
		disable: function() {
			var self = this;
			self.isDisable = true;
		},
		
		enable: function() {
			var self = this;
			self.isDisable = false;
		}
    };
	
	// jQuery bridge 
    $.fn.viewpoint = function (options) {
		var methodName, 
            pluginInstance, 
            obj = {};
		// if options is a config object, return new instance of the plugin
		if ($.isPlainObject(options) || !options) {
			return this.each(function() {
				if (!$.data(this, pluginName)) { // prevent multiple instancate plugin
					pluginInstance = new Viewpoint(this, options);
					$.data(this, pluginName, pluginInstance); // store reference of plugin name
					
					obj[pluginName] = function(elem) { 
						return $(elem).data(pluginName) !== undefined;
					};
					$.extend($.expr[":"], obj); //Adds custom jQuery pseudo selectors
					
					return pluginInstance; // use multiple instance
				}
			});
		}
		// if call method after plugin init. return method
		else if (typeof arguments[0] === "string") {
			pluginInstance = $.data(this[0], pluginName);
			if (pluginInstance) {
				methodName = arguments[0];
				if (pluginInstance[methodName]) {
					return pluginInstance[methodName].apply(pluginInstance, Array.prototype.slice.call(arguments, 1));
				}
			}
		}
    };
	
	$.fn.viewpoint.version = version;	
	
}(jQuery, document, window));
