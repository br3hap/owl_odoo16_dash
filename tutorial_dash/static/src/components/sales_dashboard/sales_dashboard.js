/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Layout } from "@web/search/layout";
import { KpiCard } from "../kpi_card/kpi_card"
import { ChartRenderer } from "../chart_renderer/chart_renderer";
import { getDefaultConfig } from "@web/views/view";
import { useService } from '@web/core/utils/hooks';
import { getColor } from '@web/views/graph/colors';

import { Component, useSubEnv, useState, onWillStart } from "@odoo/owl";

export class Sales_dashboard extends Component {

    async getTopProducts(){
        let domain = [['state', 'in', ['sale', 'done']]]
        if (this.state.period > 0){
            domain.push(['date','>', this.state.current_date])
        }

        const data = await this.orm.readGroup("sale.report", domain, ['product_id', 'price_total'], ['product_id'], {limit: 5, orderby: "price_total desc"})
        this.state.topProducts = {
            data : {
                labels: data.map(d => d.product_id[1]),
                // [
                //     'Red',
                //     'Blue',
                //     'Yellow'
                // ],
                datasets: [
                {
                    label: 'Total',
                    data: data.map(d => d.price_total),
                    // [300, 50, 100],
                    hoverOffset: 4,
                    backgroundColor: data.map((_, index) => getColor(index)),
                },{
                    label: 'Count',
                    data: data.map(d => d.product_id_count),
                    // [100, 70, 150],
                    hoverOffset: 4,
                    backgroundColor: data.map((_, index) => getColor(index)),
                }]
            }
        }
    }

    async getTopSalesPeople(){

        let domain = [['state', 'in', ['sale', 'done']]]
        if (this.state.period > 0){
            domain.push(['date','>', this.state.current_date])
        }

        const data = await this.orm.readGroup("sale.report", domain, ['user_id', 'price_total'], ['user_id'], {limit: 5, orderby: "price_total desc"})
        this.state.topSalesPeople = {
            data : {
                labels: data.map(d => d.user_id[1]),
                // [
                //     'Red',
                //     'Blue',
                //     'Yellow'
                // ],
                datasets: [
                {
                    label: 'Total',
                    data: data.map(d => d.price_total),
                    // [300, 50, 100],
                    hoverOffset: 4,
                    backgroundColor: data.map((_, index) => getColor(index)),
                }
            ]
            }
        }
        
    }

    async getMonthlySales(){
        let domain = [['state', 'in', ['draft','sent','sale', 'done']]]
        if (this.state.period > 0){
            domain.push(['date','>', this.state.current_date])
        }

        const data = await this.orm.readGroup("sale.report", domain, ['date', 'state', 'price_total'], ['date', 'state'], {orderby: "date", lazy: false})
        this.state.monthlySales = {
            data : {
                labels: [... new Set(data.map(d => d.date))],
                // [
                //     'Red',
                //     'Blue',
                //     'Yellow'
                // ],
                datasets: [
                {
                    label: 'Quotations',
                    data: data.filter(d => d.state == 'draft' || d.state == 'sent').map(d => d.price_total),
                    // [300, 50, 100],
                    hoverOffset: 4,
                    backgroundColor: "red",
                    // backgroundColor: data.map((_, index) => getColor(index)),
                },{
                    label: 'Count',
                    data: data.filter(d => ['sale', 'done'].includes(d.state)).map(d => d.price_total),
                    // [100, 70, 150],
                    hoverOffset: 4,
                    backgroundColor: "green"
                }]
            }
        }

    }

    async getPartnerOrders(){

        let domain = [['state', 'in', ['draft','sent','sale', 'done']]]
        if (this.state.period > 0){
            domain.push(['date','>', this.state.current_date])
        }

        const data = await this.orm.readGroup("sale.report", domain, ['partner_id', 'price_total', 'product_uom_qty'], ['partner_id'], {orderby: "partner_id", lazy: false})
        console.log(data, "jjjccc")
        this.state.partnerOrders = {
            data : {
                labels: data.map(d => d.partner_id[1]),
                // [
                //     'Red',
                //     'Blue',
                //     'Yellow'
                // ],
                datasets: [
                {
                    label: 'Total Amount',
                    data: data.map(d => d.price_total),
                    // [300, 50, 100],
                    hoverOffset: 4,
                    backgroundColor: "orange",
                    yAxisID: "Total",
                    order: 1
                    // backgroundColor: data.map((_, index) => getColor(index)),
                },{
                    label: 'Ordered Qty',
                    data: data.map(d => d.product_uom_qty),
                    // [100, 70, 150],
                    hoverOffset: 4,
                    backgroundColor: "blue",
                    type:"line",
                    borderColor: "blue",
                    yAxisID: "Qty",
                    order: 0

                }]
            },
            scales: {
                Qty: {
                    position: 'right',

                }
            }
        }
    }




    setup() {
        this.state = useState({
            quotations:{
                value:10,
                percentage:7,
            },
            period:90,
        })
        this.orm = useService("orm")
        this.actionService = useService("action")

        onWillStart(async () => {
            this.getDates()
            await this.getQuotations()
            await this.getOrders()
            await this.getTopProducts()
            await this.getTopSalesPeople()
            await this.getMonthlySales()
            await this.getPartnerOrders()
        })
    }

    async onChangePeriod(){
        this.getDates()
        await this.getQuotations()
        await this.getOrders()
    }


    getDates(){
        this.state.current_date = moment().subtract(this.state.period, 'days').format('YYYY-MM-DD')
        this.state.previous_date = moment().subtract(this.state.period * 2, 'days').format('YYYY-MM-DD')
    }

    async getQuotations(){
        let domain = [['state', 'in', ['sent', 'draft']]]
        if (this.state.period > 0){
            domain.push(['date_order','>', this.state.current_date])
        }
        const data = await this.orm.searchCount("sale.order", domain)
        this.state.quotations.value = data

        //previuos period

        let prev_domain = [['state', 'in', ['sent', 'draft']]]
        if (this.state.period > 0){
            prev_domain.push(['date_order','>', this.state.previous_date], ['date_order','<=', this.state.current_date])
        }
        const prev_data = await this.orm.searchCount("sale.order", prev_domain)
        const percentage = ((data - prev_data)/prev_data) * 100
        this.state.quotations.percentage = percentage.toFixed(2)

        console.log(this.state.previous_date, this.state.current_date)

    }



    async getOrders(){
        let domain = [['state', 'in', ['sale', 'done']]]
        if (this.state.period > 0){
            domain.push(['date_order','>', this.state.current_date])
        }
        const data = await this.orm.searchCount("sale.order", domain)
        //this.state.quotations.value = data

        // previous period
        let prev_domain = [['state', 'in', ['sale', 'done']]]
        if (this.state.period > 0){
            prev_domain.push(['date_order','>', this.state.previous_date], ['date_order','<=', this.state.current_date])
        }
        const prev_data = await this.orm.searchCount("sale.order", prev_domain)
        const percentage = ((data - prev_data)/prev_data) * 100
        //this.state.quotations.percentage = percentage.toFixed(2)

        //revenues
        const current_revenue = await this.orm.readGroup("sale.order", domain, ["amount_total:sum"], [])
        const prev_revenue = await this.orm.readGroup("sale.order", prev_domain, ["amount_total:sum"], [])
        const revenue_percentage = ((current_revenue[0].amount_total - prev_revenue[0].amount_total) / prev_revenue[0].amount_total) * 100

        //average
        const current_average = await this.orm.readGroup("sale.order", domain, ["amount_total:avg"], [])
        const prev_average = await this.orm.readGroup("sale.order", prev_domain, ["amount_total:avg"], [])
        const average_percentage = ((current_average[0].amount_total - prev_average[0].amount_total) / prev_average[0].amount_total) * 100

        this.state.orders = {
            value: data,
            percentage: percentage.toFixed(2),
            revenue: `$${(current_revenue[0].amount_total/1000).toFixed(2)}K`,
            revenue_percentage: revenue_percentage.toFixed(2),
            average: `$${(current_average[0].amount_total/1000).toFixed(2)}K`,
            average_percentage: average_percentage.toFixed(2),
        }

        //this.env.services.company
    }

    async viewQuotations(){
        let domain = [['state', 'in', ['sent', 'draft']]]
        if (this.state.period > 0){
            domain.push(['date_order','>', this.state.current_date])
        }

        let list_view = await this.orm.searchRead("ir.model.data", [['name', '=', 'view_quotation_tree_with_onboarding']], ['res_id'])

        this.actionService.doAction({
            type: "ir.actions.act_window",
            name: "Quotations",
            res_model: "sale.order",
            domain,
            views: [
                [list_view.length > 0 ? list_view[0].res_id : false, "list"],
                [false, "form"],
            ]
        })
    }


    viewOrders(){
        let domain = [['state', 'in', ['sale', 'done']]]
        if (this.state.period > 0){
            domain.push(['date_order','>', this.state.current_date])
        }

        this.actionService.doAction({
            type: "ir.actions.act_window",
            name: "Quotations",
            res_model: "sale.order",
            domain,
            context: {group_by: ['date_order']},
            views: [
                [false, "list"],
                [false, "form"],
            ]
        })
    }

    viewRevenues(){
        let domain = [['state', 'in', ['sale', 'done']]]
        if (this.state.period > 0){
            domain.push(['date_order','>', this.state.current_date])
        }

        this.actionService.doAction({
            type: "ir.actions.act_window",
            name: "Quotations",
            res_model: "sale.order",
            domain,
            context: {group_by: ['date_order']},
            views: [
                [false, "pivot"],
                [false, "form"],
            ]
        })
    }

}

Sales_dashboard.template = "owl.OwlSalesDashboard";
Sales_dashboard.components = { KpiCard, ChartRenderer };

registry.category("actions").add("owl.sales_dashboard", Sales_dashboard);