function scroll() {
	if(document.body.scrollTop || document.body.scrollLeft) { //谷歌浏览器
		return {
			top: document.body.scrollTop,
			left: document.body.scrollLeft
		}
	} else { // 其他浏览器
		return {
			top: document.documentElement.scrollTop,
			left: document.documentElement.scrollLeft
		}
	}
}

function changeAttr(obj, attr, offset, add){
	obj.style[attr] = obj[offset] + add + "px";
}

function $(name){
	return document.getElementsByClassName(name);
}

function show(obj){
	obj.style.display = "block";
}

function hidden(obj){
	obj.style.display = "none";
}

function Todo(data) {

	this.data = data;
	this.bindEvent();
}

Todo.prototype = {
	// 绑定元素
	bindDom: function() {
		this.task_list = store.get(this.data.recordName) || new Array();
		this.$list = $(".list");
		this.$add_task_input = $(".form input").eq(0);
		this.$list.html(null); // clear html元素
		this.$detailPage = $(".task-detail-mask").css("display", "none");
		this.max_weight = 0;
		var that = this;
		$.each(this.task_list, function(index, obj) {
			obj.detail_show = false;
			that.$list.prepend(that.createListDom(obj));
		});

		this.$list.find("li .action-delete").off("click").on("click", function() {
			$(".box-page").css("display", "block");
			var index = $(this).parent().index();
			$("#sure").off("click").on("click", function(ev) {
				ev.stopPropagation();
				$(".box-page").css("display", "none");
				that.removeTask(index);
			});

			$("#cancel").off("click").on("click", function(ev) {
				ev.stopPropagation();
				$(".box-page").css("display", "none");
			});

		});
	},

	// 提交事件
	submitEvent: function() {
		var that = this;
		$(".form").off("submit").on("submit", function(ev) {
			ev.preventDefault();
			var val = that.$add_task_input.val();
			that.$add_task_input.val("");
			that.addTask({
				content: val,
				desc: "",
				time: "",
				checked: false,
				detail_show: false,
				weight: new Date().getTime()
			});

		});
	},

	// 创建 task doms
	createListDom: function(obj) {
		var dom = "";
		if(obj.checked) {
			dom += '<li style = "opacity: 0.4"><input type="checkbox" name="" id="" checked class = "checkbox"/>';
		} else {
			dom += '<li><input type="checkbox" name="" id="" class = "checkbox"/>';
		}

		dom += '<span class="task-content">' + obj.content + '</span>' +
			'<span class="action-detail">详情</span>' +
			'<span class="action-delete">删除</span></li>';

		this.max_weight = obj.weight > this.max_weight ? obj.weight : this.max_weight;

		return dom;
	},

	// 创建 详情 dom
	createDetailDom: function(obj) {
		var detailDom = '<div class="task-detail"><form id = "detail-form">' +
			'<h3 class="task-detail-content"><input type = "text" value = "' + obj.content + '" disabled id="detail-title"/></h3>' +
			'<textarea class="desc">' + obj.desc + '</textarea>' +
			'<h3>提醒时间</h3>' +
			'<input type="datetime-local" id="warn-time" value="' + obj.time + '" />' +
			'<input type="submit" value="更新" id="update"/></form></div>';

		return detailDom;
	},

	// 打钩事件
	bindCheckedEvent: function() {
		var that = this;
		$(".checkbox").off("change").on("change", function() {
			var len = that.task_list.length;
			var index = len - $(this).parent().index() - 1;
			var first_index = 0;
			if(this.checked) {
				for(var i = 0; i < len; ++i) {
					if(!that.task_list[i].checked || that.task_list[i].weight <= that.task_list[index].weight) {
						first_index = i;
						break;
					}
				}
			} else {
				for(var i = len - 1; i >= 0; --i) {
					if(that.task_list[i].weight <= that.task_list[index].weight) {
						first_index = i;
						break;
					}
				}
			}

			that.task_list[index].checked = this.checked;
			if(this.checked) {
				that.task_list.splice(first_index, 0, $.extend({}, that.task_list[index]));
			} else {
				that.task_list.splice(first_index + 1, 0, $.extend({}, that.task_list[index]));
				++len;
			}

			that.removeTask(len - index - 1);
		});
	},

	//绑定详情事件
	bindDetailEvent: function() {
		var that = this;
		this.$detailPage.html("");
		for(var i = 0; i < this.task_list.length; ++i) {
			var obj = this.task_list[i];
			if(obj.detail_show) {
				(function(index) {
					that.$detailPage.append(that.createDetailDom(obj))
						.css("display", "block")
						.on("click", function(ev) {
							ev.stopPropagation();

							$("#detail-form").off("submit").on("submit", function(ev) {
								ev.stopPropagation();
								ev.preventDefault();
								that.task_list[index].desc = $(".desc").val();
								that.task_list[index].time = $("#warn-time").val();
								that.task_list[index].content = $("#detail-title").val();
								store.set(that.data.recordName, that.task_list);
								that.task_list[index].detail_show = false;
								that.task_list[index].weight = new Date(that.task_list[index].time).getTime();
								that.task_list.sort(function(obj1, obj2) {
									return obj1.weight - obj2.weight;
								})
								store.set(that.data.recordName, that.task_list);
								that.bindEvent();
							});

							$(".task-detail-content").off("dblclick").on("dblclick", function(ev) {
								ev.stopPropagation();
								ev.preventDefault();
								$("#detail-title").attr("disabled", false).focus().on({
									blur: function(ev) {
										$(this).attr("disabled", true);
										ev.preventDefault();
									},
								});
							});

						});
				})(i);
				break;
			}

		}

		$(window).off("click").on("click", function(ev) {
			ev.stopPropagation();
			that.$detailPage.css("display", "none");
		});

		this.$list.find(".action-detail").off("click").on("click", function(ev) {
			ev.stopPropagation();
			for(var i in that.task_list) {
				that.task_list[i].detail_show = false;
			}
			var index = that.task_list.length - $(this).parent().index() - 1;
			that.task_list[index].detail_show = true;
			// 重新绑定详情事件
			that.bindDetailEvent();

		});

	},

	// 更新权重
	updateWeight: function() {},

	// 添加任务
	addTask: function(obj) {
		if(obj.content.trim() == "") {
			return;
		}
		this.task_list.push(obj);
		store.set(this.data.recordName, this.task_list);
		// 重新绑定事件
		this.bindEvent();
	},

	removeTask: function(index) {
		this.task_list.splice(this.task_list.length - index - 1, 1);
		store.set(this.data.recordName, this.task_list);
		// 重新绑定事件
		this.bindEvent();
	},

	// 绑定事件
	bindEvent: function() {
		this.bindDom();
		this.submitEvent();
		this.bindDetailEvent();
		this.bindCheckedEvent();
	}

}