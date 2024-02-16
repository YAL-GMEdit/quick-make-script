(function() {
	let MenuItem = Electron_MenuItem;
	let TreeView = $gmedit["ui.treeview.TreeView"];
	let TreeViewItemMenus = $gmedit["ui.treeview.TreeViewItemMenus"];
	let target = null, command = null;
	function init() {
		var item = new MenuItem({
			label: "Create here",
			type: "checkbox",
			click: function() {
				let el = $gmedit["ui.treeview.TreeViewMenus"].target;
				target = target != el ? el : null;
			}
		});
		$gmedit["ui.treeview.TreeViewMenus"].items.manipCreate.submenu.append(item);
		$gmedit["ui.treeview.TreeViewMenus"].items.manipDirOnly.push(item);
		
		// Attempt to maintain target on project reload
		GMEdit.on("projectOpen", (e) => {
			if (target != null) {
				let relPath = target.getAttribute("data-rel-path");
				target = $gmedit["ui.treeview.TreeView"].element.querySelector(`.dir[data-rel-path="${relPath}"]`);
			}
		});
		
		// Only show the checkbox for script folders
		TreeView.on("itemMenu", function(e) {
			item.checked = false;
			item.enabled = false;
		});
		TreeView.on("dirMenu", function(e) {
			item.checked = e.element == target;
			var path = e.element.getAttribute("data-rel-path");
			item.enabled = path.startsWith("Scripts/") || $gmedit['gml.Project'].current.isGMS23;
		});
		//
		function create(editor, name, el, order, isSelection) {
			function doOpen() {
				TreeViewItemMenus.updatePrefix(el);
				const v23 = $gmedit['gml.Project'].current.isGMS23;
				if (!v23 && TreeViewItemMenus.prefix != "scripts/") {
					alert("Can't create a script next to this resource - please set a target directory via right-click > Create > Create here");
					return;
				}
				TreeViewItemMenus.createImplBoth(v23 ? "script" : false, order, el, name);
				setTimeout(() => {
					editor.session.bgTokenizer.start();
				});
			}
			if (window.PeekAside) {
				PeekAside.openWrap(doOpen);
			} else doOpen();
		}
		aceEditor.commands.addCommand({
			name: "createScript",
			bindKey: {win:"Ctrl-N",mac:"Command-N"},
			exec: function(e) {
				let el = target, order = 0;
				if (el == null) {
					let file = $gmedit["gml.file.GmlFile"].current;
					if (!file) return;
					let path = file.path;
					let epath = $gmedit["tools.NativeString"].escapeProp(path);
					el = TreeView.element.querySelector(`.item[data-full-path="${epath}"]`);
					if (!el) return;
					order = 1;
				}
				//
				let name = e.getSelectedText();
				if (name != "") {
					create(e, name, el, order, true);
				} else {
					var dlg = $gmedit["electron.DialogFallback"] || $gmedit["electron.Dialog"];
					dlg.showPrompt("Script name?", "", (name) => {
						if (!name) return;
						create(e, name, el, order, false);
					});
				}
			}
		});
	}
	//
	GMEdit.register("quick-make-script", {
		init: init,
		cleanup: function() {
			hide();
		},
	});
})();
