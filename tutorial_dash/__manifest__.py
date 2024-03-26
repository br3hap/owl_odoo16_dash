# -*- coding: utf-8 -*-
{
    'name': 'Tutorial_dash',
    'version': '',
    'description': """ Tutorial_dash Description """,
    'summary': """ Tutorial_dash Summary """,
    'author': '',
    'website': '',
    'category': '',
    'depends': [
        'base', 
        'web', 
        'sale', 
        'board'],
    'data': [
        "views/sales_dashboard.xml"
    ],
    'application': True,
    'installable': True,
    'auto_install': False,
    'license': 'LGPL-3',
    'assets': {
        'web.assets_backend': [
            'tutorial_dash/static/src/components/**/*.js',
            'tutorial_dash/static/src/components/**/*.xml',
            # 'odoo_custom_dashboard/static/src/components/**/*.scss',
        ],
    },
}
