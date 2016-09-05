/*
 *     Copyright (c) 2016. Dmitriy Gajewski
 *
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

const AUTOFORM_FIELD_INVALID_CLASS = "autoform-invalid";
const AUTOFORM_FORM_INVALID_CLASS = "autoform-form-invalid";
const AUTOFORM_SUBMIT_INVALID_CLASS = "autoform-submit-invalid";
const AUTOFORM_KEYERROR_CLASS = "keyerr";
const AUTOFORM_HOVERED_ONCE = "autoform-submit-hovered-once";
const AUTOFORM_KEYERROR_WRAP_CLASS = "autoforms_errors";
const HTML5_INPUT_TYPES = ['text','password','checkbox','radio','number','color','date','datetime','datetime-local','email','range','search','tel','time','url','month','week'];

class Field {
    /**
     * Field class describes single field.
     * @param node
     * @param autoForm
     */

    constructor(node, autoForm) {
        var currentField = this;
        currentField._node = node;
        node.autoformField = currentField;
        currentField._data = node.dataset;
        currentField.type = currentField._data.fieldType || currentField._node.attributes.type.value;
        currentField.empty = false;
        currentField.valid = false;
        currentField._autoForm = autoForm;
        currentField.addFieldActions();
    }

    /**
     * Method adds event listeners to field
     */
    addFieldActions() {
        var currentField = this;
        let allowAllSymbols = false,
            checkString,
            keyErrWrap,
            additionalValidation = true;

        currentField._node.addEventListener("keyup",() => currentField._autoForm.updateState());
        currentField._node.addEventListener("change",() => currentField._autoForm.updateState());
        currentField._node.addEventListener("click", function () {
            currentField._autoForm.updateState();
            if (document.querySelector(currentField._autoForm.options.ErrorMsgContainer)) {
                document.querySelectorAll(currentField._autoForm.options.ErrorMsgContainer).innerHTML = "";
            }

            this.classList.remove(AUTOFORM_FIELD_INVALID_CLASS);
        });
        currentField._node.addEventListener("keypress", function (evt) {
            let invalidKeyErrorMsg = "Unvalid char";
            if ((evt.keyCode === 13)&&(currentField._autoForm.submit.attributes.disabled !== 'disabled')&&(this.tagName!=="TEXTAREA")) {
                currentField._autoForm.submit.click();
            }

            if (currentField._autoForm.options.Validators[currentField.type].keypressValidatorFunction) {
                additionalValidation = currentField._autoForm.options.Validators[currentField.type].keypressValidatorFunction(currentField)
            }
            if (currentField._autoForm.options.Validators[currentField.type].keys) {
                checkString = currentField._autoForm.options.Validators[currentField.type].keys.split('').map(function(char){ return char.charCodeAt() }).join(' ')+' 8 9 10 13'
            } else {
                allowAllSymbols = true;
            }

            if (additionalValidation && (!allowAllSymbols) && (checkString.search(evt.which) === -1)) {
                evt.preventDefault();
                if (currentField._autoForm.options.InvalidKeyErrorMsg) {
                    if (currentField._data.keyerrwrapid) {
                        keyErrWrap = document.querySelector("." + currentField._data.keyerrwrapid);
                    } else {
                        keyErrWrap = document.querySelector("."+AUTOFORM_KEYERROR_WRAP_CLASS);
                        if (keyErrWrap) {
                            document.querySelector(currentField._autoForm.options.ErrorMsgContainer).innerHTML = '<div class="'+AUTOFORM_KEYERROR_WRAP_CLASS+'" style="opacity: 0"></div>';
                            keyErrWrap = document.querySelector("."+AUTOFORM_KEYERROR_WRAP_CLASS);
                        }
                    }
                    if (keyErrWrap) {
                        keyErrWrap.style.opacity = 1;
                        if (keyErrWrap.querySelector("."+AUTOFORM_KEYERROR_CLASS)) {
                            keyErrWrap.innerHTML = keyErrWrap.innerHTML + '<span class="'+AUTOFORM_KEYERROR_CLASS+'" style="opacity: 1">' + invalidKeyErrorMsg + '</span>';
                            setTimeout(function () {
                                keyErrWrap.querySelectorAll("."+AUTOFORM_KEYERROR_CLASS).style.opacity = 0;
                                keyErrWrap.querySelectorAll("."+AUTOFORM_KEYERROR_CLASS).remove();
                            }, 900);
                        }
                    }
                }
                return false;
            } else {
                if (currentField._autoForm.options.InvalidKeyErrorMsg&&currentField._data.keyerrwrapid) {
                    if (document.querySelectorAll("."+AUTOFORM_KEYERROR_WRAP_CLASS+" ."+AUTOFORM_KEYERROR_CLASS)) {
                        document.querySelectorAll("."+AUTOFORM_KEYERROR_WRAP_CLASS+" ."+AUTOFORM_KEYERROR_CLASS).style.opacity = 0;
                        document.querySelectorAll("."+AUTOFORM_KEYERROR_WRAP_CLASS+" ."+AUTOFORM_KEYERROR_CLASS).remove();
                    }

                }
            }
        });

        if (currentField._autoForm.options.PositiveValidation) {
            currentField._node.addEventListener("focusout", function () {
                if (currentField.validate()) {
                    currentField._node.classList.add("valid");
                    currentField._node.classList.remove(AUTOFORM_FIELD_INVALID_CLASS);
                } else {
                    if (currentField._autoForm.options.LeaveUnvalidHighlights&&currentField._autoForm._node.classList.contains(AUTOFORM_HOVERED_ONCE)) {
                        currentField._node.classList.add(AUTOFORM_FIELD_INVALID_CLASS);
                    }
                }
            });
            currentField._node.addEventListener("focusin", function(){
                currentField._node.classList.remove("valid");
            });
        }
    }

    /**
     * Method validates single field
     * @param callFromGroup if called from group validator
     * @returns {boolean|*}
     */
    validate(callFromGroup) {
        var _this = this;
        _this.empty = _this._node.value === "";
        if (!_this.empty ) { // if field is not empty
            if (_this._autoForm.options.Validators[_this.type]) {
                if (_this._autoForm.options.Validators[_this.type].validatorFunction) {
                    _this.valid = _this._autoForm.options.Validators[_this.type].validatorFunction(_this);
                } else {
                    _this.valid = true;
                }
            } else {
                _this.valid = true;
            }
        }
        else {
            if ((_this._data.required != true)&&(_this._data.required !== undefined)) {
                _this.valid = true;
            }
            else {
                _this._autoForm.errorString = "Fill up required fields";
                _this.valid = false;
            }
        }
        if (_this._data.group&&!callFromGroup) {
            _this.valid = _this._autoForm.validateGroupWithOperator(_this._data.group,_this._data.groupValidateOperator);
        }
        return _this.valid;
    };
}

/**
 * AutoForm class constructor. Accepts html node as first argument (usually form element, but can be any of its parents to)
 * @param htmlElementNode
 * @param options
 * @constructor
 */

class AutoForm {
    constructor(htmlElementNode, options) {
        var thisAutoForm = this;

        this.options = {
            Validators         : {
                "text": {
                    "keys":"",
                    "errorMessage":"",
                    "validatorFunction":false,
                    "keypressValidatorFunction":false
                },
                "password": {
                    "keys":"",
                    "errorMessage":"",
                    "validatorFunction":false,
                    "keypressValidatorFunction":false
                },
                "text-all": {
                    "keys":"",
                    "errorMessage":"",
                    "validatorFunction":false,
                    "keypressValidatorFunction":false
                },
                "text-url": {
                    "keys":"1234567890-=_+qwertyuiop[]asdfghjkl;'zxcvbnm,./QWERTYUIOP{}|ASDFGHJKL:ZXCVBNM<>?",
                    "errorMessage":"Type only latin",
                    "validatorFunction":false,
                    "keypressValidatorFunction":false
                },
                "url": {
                    "keys":"1234567890-=_+qwertyuiop[]asdfghjkl;'zxcvbnm,./QWERTYUIOP{}|ASDFGHJKL:ZXCVBNM<>?",
                    "errorMessage":"Type only latin",
                    "validatorFunction":false,
                    "keypressValidatorFunction":false
                },
                "date": {
                    "keys":"/.1234567890",
                    "errorMessage":"Type only numbers and delimiters",
                    "validatorFunction":false,
                    "keypressValidatorFunction": function (field) {
                        return (field._node.value.length < 10)
                    }
                },
                "phone": {
                    "keys":"()+-0123456789()-",
                    "errorMessage":"Type only numbers",
                    "validatorFunction":false,
                    "keypressValidatorFunction":false
                },
                "radio": {
                    "keys":"",
                    "errorMessage":"",
                    "validatorFunction": function validatorFunction(field) {
                        var checkedVals = field._autoForm._node.querySelector("input[name='" + field._node.getAttribute("name") + "']:checked");
                        return checkedVals?(checkedVals.value != undefined || !field._data.required):false;
                    },
                    "keypressValidatorFunction":false
                },
                "select": {
                    "keys": "",
                    "errorMessage": "",
                    "validatorFunction": false,
                    "keypressValidatorFunction": false
                },
                "email": {
                    "keys":"0123456789.@qwertyuiopasdfghjklzxcvbnm-QWERTYUIOPASDFGHJKLZXCVBNM_",
                    "validatorFunction":function (field) {
                        return (/\S+\@\S+\.[a-z]+/i).test(field._node.value);
                    },
                    "keypressValidatorFunction":false
                },
                "checkbox": {
                    "keys":"",
                    "errorMessage":"",
                    "validatorFunction": function validatorFunction(field) {
                        if (field._node.checked) {
                            return true;
                        }
                        return typeof field._data.required != "undefined";
                    },
                    "keypressValidatorFunction":false
                },
                "number": {
                    "keys":"0123456789",
                    "errorMessage":"Type only numbers",
                    "validatorFunction":false,
                    "keypressValidatorFunction":false
                }
            },
            ShowErrorMsg       : options.ShowErrorMsg||false,
            ErrorMsgContainer  : options.ErrorMsgContainer||".autoforms-errors",
            EnableAnimations   : options.EnableAnimations||true,
            DeactivateSubmit   : options.DeactivateSubmit||true,
            FormInvalidClass   : options.FormInvalidClass||true,
            InvalidKeyErrorMsg : options.InvalidKeyErrorMsg||true,
            InvalidKeyTimeout  : options.InvalidKeyTimeout||1000,
            CancelButton       : options.CancelButton||".cancel",
            CancelErrorMsg     : options.CancelErrorMsg||false,
            PositiveValidation : options.PositiveValidation||true,
            LeaveUnvalidHighlights: options.LeaveUnvalidHighlights || false
        };
        Object.assign(this.options.Validators, options.Validators);
        this.valid = false;
        this._node = htmlElementNode;
        // this.errorString = "";
        this.updateFields();

        htmlElementNode.addEventListener("DOMNodeInserted", function (event) {
            thisAutoForm.updateFields();
        }, false);

        if (MutationObserver) {
            var observer = new MutationObserver(function(mutations) {
                var update = false;
                mutations.forEach(function(mutation) {
                    if (mutation.type == "childList") {
                        update = true;
                    }
                });

                if (update) {
                    thisAutoForm.updateFields();
                }
            });

            observer.observe(htmlElementNode, {
                attributes: true,
                childList: true,
                characterData: true
            });
        }
    }

    /**
     * updates fields list in object (you can call this method to update fields if form changed)
     */
    updateFields() {
        var thisAutoForm = this;

        this.submit = this._node.querySelector('input[type="submit"]') ||
                      this._node.querySelector('button[type="submit"]') ||
                      document.querySelector('input[form="' + this._node.id + '"]') ||
                      document.querySelector('button[form="' + this._node.id + '"]') ||
                      this._node.querySelector('button');
        this.fields = [];
        let thisNodeId = this._node.id;
        let fields = this._node.querySelectorAll(
            (HTML5_INPUT_TYPES.map(function (fieldTypeHTML) {
                return `input[type="${fieldTypeHTML}"], input[type="${fieldTypeHTML}"][form="${thisNodeId}"]`
            }).join(', '))+
            ', select, ' +
            'textarea, ' +
            'select[form="' + this._node.id + '"]');

        for (let field of fields) {
            this.fields.push(new Field(field,thisAutoForm));
        }
    }

    /**
     * returns array of fields filtered by group
     * @param groupName
     * @returns {Array.<*>}
     */
    getFieldsByGroup(groupName) {
        var thisAutoForm = this;
        return thisAutoForm.fields.filter(function (field) {
            return field._data.group == groupName
        })
    }

    /**
     * Validate fields grouped by data-group attribute
     * @param groupName
     * @param operator validation operator (currently "or" or "and")
     * @returns {boolean}
     */
    validateGroupWithOperator(groupName, operator) {
        var thisAutoForm = this,
            fields = thisAutoForm.getFieldsByGroup(groupName),
            groupValid = false;
        
       
        switch (operator) {
            case "or": {
                fields.forEach(function (field) {
                    if (field.validate(true)) {
                        groupValid = true;
                    }
                });
            } break;
            case "and": {
                groupValid = true;
                fields.forEach(function (field) {
                    if (!field.validate(true)) {
                        groupValid = false;
                    }
                });
            } break;
            default: {
                groupValid = true;
                fields.forEach(function (field) {
                    if (!field.validate(true)) {
                        groupValid = false;
                    }
                });
            } break;
        }

        return groupValid;
    }

    /**
     * Checks all fields of form. If at least one field is not valid (validate() method returns false) returns false
     * @returns {boolean}
     */
    validate() {
        var _this = this;
        _this.valid = true;
        for (let field of _this.fields) {
            if (!field.validate()) {
                _this.valid = false;
            }
        }
        return _this.valid;
    };

    /**
     * This method run actions that changes form states
     */
    updateState() {
        var _this = this;
        if (_this.validate()) {
            if (_this.options.FormInvalidClass) {
                _this._node.classList.remove(AUTOFORM_FORM_INVALID_CLASS);
            }
            if (_this.options.DeactivateSubmit) {
                _this.submit.parentElement.classList.remove(AUTOFORM_SUBMIT_INVALID_CLASS);
                _this.submit.removeAttribute("disabled");
            }
        }
        else {
            if (_this.options.FormInvalidClass) {
                _this._node.classList.add(AUTOFORM_FORM_INVALID_CLASS);
            }
            if (_this.options.DeactivateSubmit) {
                _this.submit.parentElement.classList.add(AUTOFORM_SUBMIT_INVALID_CLASS);
                _this.submit.setAttribute("disabled","disabled");
            }
        }
    }


    /**
     * This method inits all events of form including field events and submit hover events
     */
    initEvents() {
        var _this = this;

        _this.submit.parentNode.addEventListener("mouseenter", function () {
            _this.highlightInvalidFields("on");
            if (!_this._node.classList.contains(AUTOFORM_HOVERED_ONCE)) {
                _this._node.classList.add(AUTOFORM_HOVERED_ONCE);
            }
            if (_this.valid) {
            }
            else {
                if (_this.options.ShowErrorMsg) {
                    if (_this._node.getElementById(AUTOFORM_KEYERROR_WRAP_CLASS).length < 1) {
                        _this._node.getElementById(_this.options.ErrorMsgContainer).innerHTML = '<div class="'+AUTOFORM_KEYERROR_WRAP_CLASS+'" style="opacity: 0"></div>';
                    }
                    if (_this.options.EnableAnimations) {
                        _this._node.getElementById(AUTOFORM_KEYERROR_WRAP_CLASS).innerHTML = "<span style='opacity:1'>"+errorString+"</span>";
                    }
                    else {
                        _this._node.getElementById(AUTOFORM_KEYERROR_WRAP_CLASS).innerHTML = "<span style='opacity:1'>"+errorString+"</span>";
                    }
                }
            }
        });
        _this.submit.parentNode.addEventListener("mouseleave", function () {
            if (!_this.options.LeaveUnvalidHighlights) {
                _this.highlightInvalidFields("off");
            }
            if (_this.valid) {
            }
            if (_this.options.ShowErrorMsg) {
                if (_this.options.EnableAnimations) {
                    _this._node.getElementById(AUTOFORM_KEYERROR_WRAP_CLASS).style.opacity = 0;
                }
                else {
                    _this._node.getElementById(AUTOFORM_KEYERROR_WRAP_CLASS).innerHTML = "";
                }

            }
        });


        if (_this.valid) {
            if (_this.options.FormInvalidClass) {
                _this._node.classList.remove(AUTOFORM_FORM_INVALID_CLASS);
            }
            if (_this.options.DeactivateSubmit) {
                _this.submit.parentNode.classList.remove(AUTOFORM_SUBMIT_INVALID_CLASS);
                if (_this.submit.attributes.disabled) {
                    _this.submit.removeAttribute("disabled");
                }

            }
        }
        else {
            if (_this.options.FormInvalidClass) {
                _this._node.classList.remove(AUTOFORM_FORM_INVALID_CLASS);
            }
            if (_this.options.DeactivateSubmit) {
                _this.submit.parentNode.classList.add(AUTOFORM_SUBMIT_INVALID_CLASS);
                _this.submit.setAttribute("disabled","disabled");
            }
        }

        if (_this.options.CancelErrorMsg) {
            document.querySelector(_this.options.CancelButton).addEventListener("mouseenter", function () {
                _this.errorString = "Будут отменены все изменения!";
                if (document.getElementById(AUTOFORM_KEYERROR_WRAP_CLASS).length < 1) {
                    document.getElementById(_this.options.ErrorMsgContainer).innerHTML = '<div id="'+AUTOFORM_KEYERROR_WRAP_CLASS+'" style="opacity: 0"></div>';
                }
                if (_this.options.EnableAnimations) {
                    document.getElementById(AUTOFORM_KEYERROR_WRAP_CLASS).innerHTML = "<span style='opacity:1'>"+errorString+"</span>";
                }
                else {
                    document.getElementById(AUTOFORM_KEYERROR_WRAP_CLASS).innerHTML = "<span style='opacity:1'>"+errorString+"</span>";
                }
            });
            document.querySelector(_this.options.CancelButton).addEventListener("mouseleave", function () {
                _this. errorString = "";
                if (_this.options.EnableAnimations) {
                    document.getElementById(AUTOFORM_KEYERROR_WRAP_CLASS).style.opacity = 0;
                }
                else {
                    document.getElementById(AUTOFORM_KEYERROR_WRAP_CLASS).innerHTML = "";
                }
            });
        }
    }

    /**
     * This method just highlighting invalid fields.
     * @param opts (off|on) off - removes highlight class from fields
     */
    highlightInvalidFields(opts) {
        var _this = this;
        for (let field of _this.fields) {
            if (opts !== "off") {
                if (field.validate()) {
                    field._node.classList.remove(AUTOFORM_FIELD_INVALID_CLASS);
                }
                else {
                    field._node.classList.add(AUTOFORM_FIELD_INVALID_CLASS);
                }
            }

            if (opts === "off") {
                field._node.classList.remove(AUTOFORM_FIELD_INVALID_CLASS);
            }
        }
    };
}

var autoforms = {
    widgets: {}, // all widgets with inited autoform
    init: function (htmlElementNode, options) {
        var aufm = this,

            newElementName = (htmlElementNode.className+htmlElementNode.id).toLowerCase().replace(new RegExp("[^[a-zA-Z0-9]]*","g"),'_');

        if (!options) options = {};

        var newAufmWidget = htmlElementNode.autoform = aufm.widgets[newElementName] = new AutoForm(htmlElementNode, options);
        newAufmWidget.initEvents();

    }
};
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory;
    } else {
        root.returnExports = factory;
    }
}(this, autoforms));