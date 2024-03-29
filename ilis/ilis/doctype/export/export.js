// Copyright (c) 2022, Ikode-IT and contributors
// For license information, please see license.txt

frappe.ui.form.on('Export', {
	refresh: function(frm) {
		cur_frm.add_custom_button(__('Cargo Tracking'), function(){
				frappe.model.open_mapped_doc({
					method: "ilis.ilis.doctype.export.export.make_cargo_tracking",
					frm: cur_frm
				})
		}, __('Create'));
		cur_frm.add_custom_button(__('Container Entry'), function(){
				frappe.model.open_mapped_doc({
					method: "ilis.ilis.doctype.export.export.make_container_entry",
					frm: cur_frm
				})
		}, __('Create'));
			
			
		/*frm.add_custom_button(__("Get Containers"), function() {
            show_container_dialog(frm);
        })*/

        /*frm.fields_dict["export_container"].grid.add_custom_button(__('Get Containers'), 
			function() {
				//frappe.msgprint(__("GetCo"));
				show_container_dialog(frm);
        });*/
        //frm.fields_dict["export_container"].grid.grid_buttons.find('.btn-custom').removeClass('btn-default').addClass('btn-primary');


	},

	setup: function(frm){
		frm.set_query("container_number", "containers_on_truck", function(doc, cdt, cdn){
			let row = locals[cdt] [cdn]
			return {
				filters: [
					['Container','status','=', 'Available'],
				]
			}
		});

		frm.set_query("container_number", "export_container", function(doc, cdt, cdn){
			let row = locals[cdt] [cdn]
			return {
				filters: [
					['Container','purpose','!=', 'Container Entry'],
					['Container','export_reference','=', doc.name],
				]
			}
		});
	},

	stuffing_date: function(frm) {
		var aday = new Date();
		var to_date = aday.toISOString().split('T')[0];
		frm.set_value("storage_days", frappe.datetime.get_day_diff( frappe.datetime.add_days(frm.doc.stuffing_date, 20), to_date));
		//frm.set_value("storage_days", frappe.datetime.get_day_diff( to_date , frm.doc.stuffing_date));
		refresh_field(frm.doc.storage_days);
	},
	after_balance: function(frm) {
		$.each(frm.doc.loading_list || [], function(i, d) {
			if(!d.gross_weight) d.gross_weight = frm.doc.after_balance;
		});
		refresh_field("loading_list");
	},
	vessel_name: function(frm) {
		$.each(frm.doc.loading_list || [], function(i, d) {
			if(!d.vessel) d.vessel = frm.doc.vessel_name;
		});
		refresh_field("loading_list");
	},
	shipping_line: function(frm) {
		$.each(frm.doc.loading_list || [], function(i, d) {
			if(!d.shipping_line) d.shipping_line = frm.doc.shipping_line;
		});
		refresh_field("loading_list");
	},
	booking_number: function(frm) {
		$.each(frm.doc.loading_list || [], function(i, d) {
			if(!d.document_number) d.document_number = frm.doc.booking_number;
		});
		refresh_field("loading_list");
	},
	cargo: function(frm) {
		$.each(frm.doc.loading_list || [], function(i, d) {
			if(!d.commodity) d.commodity = frm.doc.cargo;
		});
		refresh_field("loading_list");
	},
	loading_place: function(frm) {
		$.each(frm.doc.loading_list || [], function(i, d) {
			if(!d.origin) d.origin = frm.doc.loading_place;
		});
		refresh_field("loading_list");
	},
});


function show_container_dialog(frm) {
   frappe.prompt([
      {'fieldname': 'booking_number', 'fieldtype': 'Link', 'label': 'Container Release', 'reqd': 1, 'options': 'Container Release'}  
   ],
   function(booking_number){
      console.log(booking_number.booking_number);
      get_container_from_release(booking_number.booking_number);
   },
   'Get Containers from Release',
   'Get Containers'
  )
}

function get_container_from_release(booking_number) {
  frappe.call({
    "method": "frappe.client.get",
    "args": {
        "doctype": "Container Release",
        "name": booking_number
    },
    "callback": function(response) {
         // add items to your child table
         var sinv = response.message;
         sinv.container_collected.forEach(function (item) {
             var child = cur_frm.add_child('export_container');
             frappe.model.set_value(child.doctype, child.name, 'container_number', item.container_number);
             //frappe.model.set_value(child.doctype, child.name, 'release_date', item.release_date);
         });
         cur_frm.refresh_field('export_container');
     }
   });
}

frappe.ui.form.on("Export", "validate", function(frm) {
	if (frm.doc.tunduma_departure_date < frm.doc.tunduma_arrival) {
		frappe.msgprint(__("Tunduma Arrival date cannot be later than Departure"));
		frappe.validated = false;
	}
	if (frm.doc.gate_in_date < frm.doc.arrival_date) {
		frappe.msgprint(__("Arrival date cannot be later than Gate in Date"));
		frappe.validated = false;
	}
	
});


frappe.ui.form.on("Loading List", {
	container_number: function(frm,cdt,cdn) {
		var row = locals[cdt][cdn];
		if (frm.doc.booking_number) {
			row.document_number = frm.doc.booking_number;
			refresh_field("document_number", cdn, "loading_list");
		} else {
			frm.script_manager.copy_from_first_row("loading_list", row, ["document_number"]);
		}
	},
	/*release_date: function(frm, cdt, cdn) {
		if(!frm.doc.release_date) {
			erpnext.utils.copy_value_in_all_rows(frm.doc, cdt, cdn, "containers_released", "release_date");
		}
	}*/
});

frappe.ui.form.on("Container Export", {
	container_number: function(frm,cdt,cdn) {
		
		var row = locals[cdt][cdn];
		//doc = frappe.get_doc("Container", row.container_number);
		//console.log(doc);
		var doc = {}
		frappe.call({
	        method: "frappe.client.get",
	        args: {
	            doctype: "Container",
	            name: row.container_number,
        	},
	        callback(r) {
	            if(r.message) {
	            	row.type = r.message.size
	            	row.iso = r.message.iso
	            	row.size = r.message.size
	            	row.seal = r.message.seal
	                console.log(r.message.size);
	                console.log(r.message.size);
	                
	            }
	        }
    	});
    	refresh_field("size", cdn, "export_container");
    	//console.log(row.size);

		/*row.size = doc.size
		row.type = doc.size
		row.seal = doc.seal
		refresh_field("size", cdn, "export_container");
		refresh_field("type", cdn, "export_container");
		refresh_field("seal", cdn, "export_container");
	*/
		row.weight = frm.doc.after_balance
		row.vessel = frm.doc.vessel_name
		row.shipping_line = frm.doc.shipping_line
		row.document_number = frm.doc.booking_number
		row.shipper = frm.doc.client
		row.commodity = frm.doc.cargo
		row.pod = frm.doc.discharge_port
		row.origin = frm.doc.loading_place
		row.fcl = "FCL"
	}
});