// /**
// THESE MUST EXIST FIRST
//  * [x] user
//  * [x] enterprise
//  * [x] vehicle
//  * [x] driver
//  * [x] client
//  * [x] delivery_week

// THESE ARE CREATED DURING OPERATIONS
//  * [] checklist
//  * [] route
//  * [] stop

// THESE DEPEND ON THE PREVIOUS IN ORDER TO BE CREATED
//  * [] checklist_event
//  * [] route_template
//  * [] event_template

// THESE CAN BE CREATED SEPERATELY WHEN OPERATIONS ARE BEING CONDUCTED - THEY DEPEND ON ROUTE,STOP OR DRIVER
//  * [] event
//  * [] evidence

// CMS ENTITIES NEEDED FOR PHP FRAMEWORK
//  * [] cms_menu
//  * [] log
//  * [] mc_log
//  * [] mc_template
//  * [] support_log
//  * [] report

import {
        DeliveryWeekFinished,
        DriverCertification,
        DriverCourses,
        DriverInsuranceStatus,
        DriverManeuvers,
        DriverStatus,
        DriverTravelAvailability,
        EnterpriseObjective,
        PrismaClient,
        UserActive,
        UserType,
        VehicleStatus,
} from '@prisma/client';

//  */
const prisma = new PrismaClient();

const users = [
        {
                name: 'Roberto',
                last_name: 'Hernandez',
                date_of_birth: new Date(),
                type: UserType.SUPER,
                email: 'roberto@gmail.com',
                pass: 'mypassword',
                token: 'djhfjdfjdhfjdh',
                phone: '+1 777 666 3434',
                referral_code: 'idjfhdjhf',
                active: UserActive.TRUE,
        },
        {
                name: 'Agustin',
                last_name: 'Miramontes',
                date_of_birth: new Date(),
                type: UserType.ADMIN,
                email: 'agus@gmail.com',
                pass: 'mypassword',
                token: 'djhfjdfjdhfjdh',
                phone: '+1 766 655 9797',
                referral_code: 'idjfhdjhf',
                active: UserActive.TRUE,
        },
        {
                name: 'Juan',
                last_name: 'Dolores',
                date_of_birth: new Date(),
                type: UserType.MANAGER,
                email: 'juane@gmail.com',
                pass: 'mypassword',
                token: 'djhfjdfjdhfjdh',
                phone: '+1 777 666 2431',
                referral_code: 'idjfhdjhf',
                active: UserActive.TRUE,
        },
        {
                name: 'Oscar',
                last_name: 'Villa',
                date_of_birth: new Date(),
                type: UserType.DRIVER,
                email: 'oscar@gmail.com',
                pass: 'mypassword',
                token: 'djhfjdfjdhfjdh',
                phone: '+1 777 798 5209',
                referral_code: 'idjfhdjhf',
                active: UserActive.TRUE,
        },
];

async function main() {
        const userRes = await prisma.user.createMany({
                data: users,
                // skipDuplicates: true, // This option skips records with duplicate values, e.g., in unique fields like email
        });
        console.log(`Created ${userRes.count}`);

        const owner = await prisma.user.findFirst({
                where: {
                        id_user: 1,
                },
        });
        const enterprise = await prisma.enterprise.create({
                data: {
                        name: 'RutitaFlow',
                        id_owner: owner.id_user,
                        components: 'components',
                        description: 'descripton example bla bla',
                        objective: EnterpriseObjective.LOGISTICS,
                        settings: 'test settings',
                },
        });
        console.log(`Created enterprise:  ${enterprise.name}`);

        await prisma.deliveryWeek.create({
                data: {
                        week_start: new Date(),
                        notes: 'will start the week soon',
                        finished: DeliveryWeekFinished.FALSE,
                        id_enterprise: enterprise.id_enterprise,
                },
        });
        console.log('DeliveryWeek created');

        await prisma.client.create({
                data: {
                        id_enterprise: enterprise.id_enterprise,
                        name: 'Papas el Pepe',
                        contract_description: 'lorim episum',
                        pickup_time: 4444,
                        delivery_time: 423,
                },
        });
        console.log('Client created');

        const driver = await prisma.user.findFirst({
                where: {
                        id_user: 4,
                },
        });
        await prisma.driver.create({
                data: {
                        id_enterprise: enterprise.id_enterprise,
                        id_user: driver.id_user,
                        date_of_birth: new Date(),
                        alias: 'toreto',
                        img: 'selfie',
                        status: DriverStatus.AVAILABLE,
                        ine_exp_date: new Date(),
                        license_exp_date: new Date(),
                        insurance_status: DriverInsuranceStatus.TRUE,
                        insurance_number: 'skd0dfd00--fdfdf',
                        emergency_contact: 'mom',
                        operator_type: 'everthing',
                        certification: DriverCertification.TRUE,
                        courses: DriverCourses.TRUE,
                        entry_date: new Date(),
                        travel_availability: DriverTravelAvailability.TRUE,
                        maneuvers: DriverManeuvers.TRUE,
                },
        });
        console.log('Driver created');

        await prisma.vehicle.create({
                data: {
                        id_enterprise: enterprise.id_enterprise,
                        name: 'La Oxidada',
                        img: 'Selfie with la Oxidada',
                        status: VehicleStatus.AVAILABLE,
                        brand: 'Volvo',
                        model: 'FM',
                        year: 2010,
                        color: 'Pink',
                        motor: 'Lots of Cilinders',
                        serial_number: '38783-eiie0-ff',
                        fuel_type: 'Diesel',
                        plate_number: 'I-AM-SPEED',
                        capacity: '5 tons',
                        dimension: 'very big truck',
                        comments: 'she aint pretty, but she is the best',
                },
        });
        console.log('Vehicle created');

        //CMS
        const cmsData = [
                // 1
                {
                        titulo: 'Users',
                        orden: 1,
                        tabla: 'user',
                        grupo: 'admin',
                        icon: 'icon-user',
                        descripcion: 'Users administration',
                        tipo: 'catalogo',
                        listado: 'name,type,id_user',
                        campos: `[
    {
        "campo": "name"
    },
    {
        "titulo": "Last name",
        "campo": "last_name"
    },
    {
        "campo": "email"
    },
    {
        "titulo": "User name",
        "campo": "user"
    },
    {
        "titulo": "Password",
        "campo": "pass"
    },
    {
        "campo": "phone"
    },
    {
        "campo": "type",
        "tipo": "combo",
        "enum": [
            "super",
            "admin",
            "driver",
            "manager",
            "logistics",
            "external"
        ]
    },
    {
        "titulo": "Enterprise",
        "campo": "id_enterprise",
        "label": "enterprise_name",
        "listado": "combo_sin_enterprise",
        "tabla": "enterprise",
        "tipo": "combo",
        "title": "enterprise_name",
        "titulo": "Enterprise",
        "value": "id_enterprise"
    },
    {
        "campo": "active",
        "tipo": "check"
    }
]`,
                },
                // 2
                {
                        titulo: 'Checklist',
                        orden: 2,
                        tabla: 'checklist',
                        grupo: 'admin',
                        icon: 'icon-check',
                        descripcion: 'Checklist administration',
                        tipo: 'catalogo',
                        listado: 'item,client_name,id_checklist',
                        campos: `[
    {
        "campo": "item"
    },
    {
        "campo": "id_client",
        "label": "client_name",
        "listado": "combo_client",
        "tabla": "client",
        "tipo": "combo",
        "title": "client_name",
        "titulo": "client",
        "value": "id_client"
    }
]
`,
                },

                // 3
                {
                        titulo: 'Checklist Event',
                        orden: 3,
                        tabla: 'checklist_event',
                        grupo: 'admin',
                        icon: 'icon-notebook',
                        descripcion: 'Checklist event administrationn',
                        tipo: 'catalogo',
                        listado: 'checklist_item,route_name,id_checklist_event',
                        campos: `[
    {
        "campo": "id_checklist",
        "label": "checklist_item",
        "listado": "combo_checklist",
        "tabla": "checklist",
        "tipo": "combo",
        "title": "checklist_item",
        "titulo": "checklist",
        "value": "id_checklist"
    },
    {
        "campo": "id_route",
        "label": "route_name",
        "listado": "combo_route",
        "tabla": "route",
        "tipo": "combo",
        "title": "route_name",
        "titulo": "route",
        "value": "id_route"
    },
    {
        "campo": "img",
        "titulo": "Image",
        "tipo": "file"
    }
]
`,
                },
                // 4
                {
                        titulo: 'Client',
                        orden: 4,
                        tabla: 'client',
                        grupo: 'admin',
                        icon: 'icon-user-following',
                        descripcion: 'Client administration',
                        tipo: 'catalogo',
                        listado: 'name,enterprise_name,id_client',
                        campos: `[
    {
        "campo": "name"
    },
    {
        "campo": "contract_description",
        "titulo": "Contract description",
        "tipo": "editor"
    },
    {
        "campo": "pickup_time",
        "titulo": "Pickup time"
    },
    {
        "campo": "delivery_time",
        "titulo": "Delivery time",
        "tipo": "date"
    },
    {
        "campo": "id_enterprise",
        "label": "enterprise_name",
        "listado": "combo_enterprise",
        "tabla": "enterprise",
        "tipo": "combo",
        "title": "enterprise_name",
        "titulo": "Enterprise",
        "value": "id_enterprise"
    }
]
`,
                },
                // 5
                {
                        titulo: 'Delivery Week',
                        orden: 5,
                        tabla: 'delivery_week',
                        grupo: 'admin',
                        icon: 'icon-list',
                        descripcion: 'Delivery week administration ',
                        tipo: 'catalogo',
                        listado: 'enterprise_name,week_start,id_delivery_week',
                        campos: `[
  {
    "campo": "week_start",
    "tipo": "date",
    "titulo": "Week start"
  },
  {
    "campo": "notes"
  },
  {
    "campo": "finished",
    "tipo": "check"
  },
  {
    "campo": "id_company",
    "label": "enterprise_name",
    "listado": "combo_enterprise",
    "tabla": "enterprise",
    "tipo": "combo",
    "title": "enterprise_name",
    "titulo": "enterprise",
    "value": "id_enterprise"
  }
] `,
                },
                // 6
                {
                        titulo: 'Driver',
                        orden: 6,
                        tabla: 'driver',
                        grupo: 'admin',
                        icon: 'icon-key',
                        descripcion: 'Driver administration ',
                        tipo: 'catalogo',
                        listado: 'driver_name,status,id_driver',
                        campos: `[
    {
        "campo": "id_user",
        "label": "name",
        "listado": "combo_user",
        "tabla": "user",
        "tipo": "combo",
        "title": "user_name",
        "titulo": "user",
        "value": "id_user"
    },
    {
        "campo": "id_enterprise",
        "label": "enterprise_name",
        "listado": "combo_enterprise",
        "tabla": "enterprise",
        "tipo": "combo",
        "title": "enterprise_name",
        "titulo": "Enterprise",
        "value": "id_enterprise"
    },
	{
        "titulo": "Date of birth",
        "campo": "date_of_birth",
        "tipo": "date"
    },
    {
        "campo": "alias"
    },
    {
        "campo": "img",
        "titulo": "Image",
        "tipo": "file"
    },
    {
        "campo": "status",
        "tipo": "combo",
        "enum": [
            "available",
            "nodocs",
            "unavailable"
        ]
    },
    {
        "titulo": "INE expiration",
        "campo": "ine_exp_date",
        "tipo": "date"
    },
    {
        "titulo": "License expiration",
        "campo": "license_exp_date",
        "tipo": "date"
    },
    {
        "titulo": "Insurance",
        "campo": "insurance_status",
        "tipo": "check"
    },
    {
        "titulo": "Insurance number",
        "campo": "insurance_number"
    },
    {
        "titulo": "Emergency contact",
        "campo": "emergency_contact"
    },
    {
        "titulo": "Operator type",
        "campo": "operator_type"
    },
    {
        "campo": "certification",
        "tipo": "check"
    },
    {
        "campo": "courses",
        "tipo": "check"
    },
    {
        "titulo": "Entry date",
        "campo": "entry_date",
        "tipo": "date"
    },
    {
        "titulo": "Travel availability",
        "campo": "travel_availability",
        "tipo": "check"
    },
    {
        "campo": "maneuvers",
        "tipo": "check"
    }
] `,
                },
                // 7
                {
                        titulo: 'Enterprise',
                        orden: 7,
                        tabla: 'enterprise',
                        grupo: 'admin',
                        icon: 'icon-users',
                        descripcion: 'Enterprise administration ',
                        tipo: 'catalogo',
                        listado: 'name,user_name,id_enterprise',
                        campos: `[
    {
        "campo": "name"
    },
    {
        "campo": "id_owner",
        "label": "name",
        "listado": "combo_user",
        "tabla": "user",
        "tipo": "combo",
        "title": "user_name",
        "titulo": "Owner",
        "value": "id_user"
    },
    {
        "campo": "components"
    },
    {
        "campo": "description"
    },
    {
        "campo": "objective",
        "tipo": "combo",
        "enum": [
            "subscription",
            "logistics",
            "ecommerce",
            "complete"
        ]
    },
    {
        "campo": "settings",
        "tipo": "editor"
    }
]
 `,
                },
                // 8
                {
                        titulo: 'Event',
                        orden: 8,
                        tabla: 'event',
                        grupo: 'admin',
                        icon: 'icon-pin',
                        descripcion: 'Event administration',
                        tipo: 'catalogo',
                        listado: 'route_name,driver_name,status',
                        campos: `[
    {
        "campo": "id_route",
        "label": "route_name",
        "listado": "combo_route",
        "tabla": "route",
        "tipo": "combo",
        "title": "route_name",
        "titulo": "route",
        "value": "id_route"
    },
    {
        "campo": "id_stop",
        "label": "stop_title",
        "listado": "combo_stop",
        "tabla": "stop",
        "tipo": "combo",
        "title": "stop_title",
        "titulo": "stop",
        "value": "id_stop"
    },
    {
        "campo": "status",
        "tipo": "combo",
        "enum": [
            "pending",
            "route",
            "issue",
            "service",
            "completed"
        ]
    },
    {
        "campo": "date_route",
        "titulo": "date route",
	"tipo": "date"
    },
    {
        "campo": "date_service",
        "titulo": "date service",
	"tipo": "date"
    },
    {
        "campo": "date_completed",
        "titulo": "date completed",
	"tipo": "date"
    },
    {
        "campo": "service_time",
        "titulo": "service time"
    },
    {
        "campo": "driver_comments",
        "titulo": "driver comments"
    },
    {
        "campo": "eta"
    },
    {
        "campo": "id_driver",
        "label": "driver_name",
        "listado": "combo_driver",
        "tabla": "driver",
        "tipo": "combo",
        "title": "driver_name",
        "titulo": "driver",
        "value": "id_driver"
    },
    {
        "campo": "priority_status",
	"titulo": "priority status",
        "tipo": "combo",
        "enum": [
            "urgent",
            "normal",
            "noturgent"
        ]
    },
    {
        "campo": "order"
    },
    {
        "campo": "km"
    },
    {
        "campo": "logistic_comments",
        "titulo": "logistic comments",
        "tipo": "editor"
    },
    {
        "campo": "pos"
    }
]
 `,
                },
                // 9
                {
                        titulo: 'Event Template',
                        orden: 9,
                        tabla: 'event_template',
                        grupo: 'admin',
                        icon: 'icon-globe',
                        descripcion: 'Event template administration',
                        tipo: 'catalogo',
                        listado: 'route_template_name,stop_title,id_event_template',
                        campos: `[
    {
        "campo": "id_route_template",
        "label": "route_template_name",
        "listado": "combo_route_template",
        "tabla": "route_template",
        "tipo": "combo",
        "title": "route_template_name",
        "titulo": "route template",
        "value": "id_route_template"
    },
    {
        "campo": "id_stop",
        "label": "stop_title",
        "listado": "combo_stop",
        "tabla": "stop",
        "tipo": "combo",
        "title": "stop_title",
        "titulo": "stop",
        "value": "id_stop"
    },
    {
        "campo": "pos"
    }
]

 `,
                },
                // 10
                {
                        titulo: 'Evidence',
                        orden: 10,
                        tabla: 'evidence',
                        grupo: 'admin',
                        icon: 'icon-globe-alt',
                        descripcion: 'Evidence administration',
                        tipo: 'catalogo',
                        listado: 'event_details,type,id_evidence',
                        campos: `[
    {
        "campo": "id_event",
        "label": "event_details",
        "listado": "combo_event",
        "tabla": "event",
        "tipo": "combo",
        "title": "event_details",
        "titulo": "event",
        "value": "id_event"
    },
    {
        "campo": "img",
        "titulo": "image",
        "tipo": "file"
    },
    {
        "campo": "type"
    },
    {
        "campo": "approved",
        "tipo": "check"
    }
]
 `,
                },
                // 11
                {
                        titulo: 'Route',
                        orden: 11,
                        tabla: 'route',
                        grupo: 'admin',
                        icon: 'icon-map',
                        descripcion: 'Route administration',
                        tipo: 'catalogo',
                        listado: 'name,driver_name,id_route',
                        campos: `[
    {
        "campo": "id_enterprise",
        "label": "enterprise_name",
        "listado": "combo_enterprise",
        "tabla": "enterprise",
        "tipo": "combo",
        "title": "enterprise_name",
        "titulo": "Enterprise",
        "value": "id_enterprise"
    },
    {
        "campo": "id_client",
        "label": "client_name",
        "listado": "combo_client",
        "tabla": "client",
        "tipo": "combo",
        "title": "client_name",
        "titulo": "client",
        "value": "id_client"
    },
    {
        "campo": "id_vehicle",
        "label": "vehicle_name",
        "listado": "combo_vehicle",
        "tabla": "vehicle",
        "tipo": "combo",
        "title": "vehicle_name",
        "titulo": "vehicle",
        "value": "id_vehicle"
    },
    {
        "campo": "id_driver",
        "label": "driver_name",
        "listado": "combo_driver",
        "tabla": "driver",
        "tipo": "combo",
        "title": "driver_name",
        "titulo": "driver",
        "value": "id_driver"
    },
    {
        "campo": "id_route_template",
        "label": "route_template_name",
        "listado": "combo_route_template",
        "tabla": "route_template",
        "tipo": "combo",
        "title": "route_template_name",
        "titulo": "route template",
        "value": "id_route_template"
    },
    {
        "campo": "name"
    },
    {
        "campo": "date_start",
        "titulo": "date start",
        "tipo": "date"
    },
    {
        "campo": "date_end",
        "titulo": "date end",
        "tipo": "date"
    },
    {
        "campo": "polyline",
        "tipo": "editor"
    },
    {
        "campo": "total_duration",
        "titulo": "total duration"
    },
    {
        "campo": "total_distance",
        "titulo": "total distance"
    },
    {
        "campo": "stop_initial",
        "titulo": "stop initial"
    },
    {
        "campo": "stop_final",
        "titulo": "stop final"
    }
]
 `,
                },
                // 12
                {
                        titulo: 'Route Template',
                        orden: 12,
                        tabla: 'route_template',
                        grupo: 'admin',
                        icon: 'icon-directions',
                        descripcion: 'Route template administration',
                        tipo: 'catalogo',
                        listado: 'name,driver_name,id_route_template',
                        campos: `[
    {
        "campo": "name"
    },
    {
        "campo": "id_driver",
        "label": "driver_name",
        "listado": "combo_driver",
        "tabla": "driver",
        "tipo": "combo",
        "title": "driver_name",
        "titulo": "driver",
        "value": "id_driver"
    },
    {
        "campo": "description",
        "tipo": "editor"
    },
    {
        "campo": "color"
    },
    {
        "campo": "symbol"
    },
    {
        "campo": "id_enterprise",
        "label": "enterprise_name",
        "listado": "combo_enterprise",
        "tabla": "enterprise",
        "tipo": "combo",
        "title": "enterprise_name",
        "titulo": "Enterprise",
        "value": "id_enterprise"
    },
    {
        "campo": "stop_initial",
        "titulo": "stop initial"
    },
    {
        "campo": "stop_final",
        "titulo": "stop final"
    },
    {
        "campo": "tag"
    }
]
 `,
                },
                // 13
                {
                        titulo: 'Stop',
                        orden: 13,
                        tabla: 'stop',
                        grupo: 'admin',
                        icon: 'icon-target',
                        descripcion: 'Stop administration',
                        tipo: 'catalogo',
                        listado: 'title,schedule,id_stop',
                        campos: `[
    {
        "campo": "id_client",
        "label": "client_name",
        "listado": "combo_client",
        "tabla": "client",
        "tipo": "combo",
        "title": "client_name",
        "titulo": "client",
        "value": "id_client"
    },
    {
        "campo": "id_base_route",
        "label": "route_template_name",
        "listado": "combo_route_template",
        "tabla": "route_template",
        "tipo": "combo",
        "title": "route_template_name",
        "titulo": "route template",
        "value": "id_route_template"
    },
    {
        "campo": "type",
        "tipo": "combo",
        "enum": [
            "visit",
            "gas",
            "parking",
            "cedis",
            "main",
            "workshop"
        ]
    },
    {
        "campo": "title"
    },
    {
        "campo": "main",
        "tipo": "check"
    },
    {
        "campo": "schedule"
    },
    {
        "campo": "line1",
        "titulo": "line 1"
    },
    {
        "campo": "line2",
        "titulo": "line 2"
    },
    {
        "campo": "zip",
        "titulo": "zip code"
    },
    {
        "campo": "city"
    },
    {
        "titulo": "time start",
        "campo": "time_start"
    },
    {
        "titulo": "time end",
        "campo": "time_end"
    },
    {
        "campo": "lat"
    },
    {
        "campo": "lon"
    },
    {
        "campo": "comments",
        "tipo": "editor"
    }
]
 `,
                },
                // 13
                {
                        titulo: 'Vehicle',
                        orden: 14,
                        tabla: 'vehicle',
                        grupo: 'admin',
                        icon: 'iicon-speedometer',
                        descripcion: 'Vehicle administration',
                        tipo: 'catalogo',
                        listado: 'name,status,id_vehicle',
                        campos: `
    {
        "campo": "id_enterprise",
        "label": "enterprise_name",
        "listado": "combo_enterprise",
        "tabla": "enterprise",
        "tipo": "combo",
        "title": "enterprise_name",
        "titulo": "Enterprise",
        "value": "id_enterprise"
    },
    {
        "campo": "name"
    },
    {
        "campo": "img",
        "titulo": "image",
        "tipo": "file"
    },
    {
        "campo": "status",
        "tipo": "combo",
        "enum": [
            "available",
            "workshop",
            "route",
            "unavailable"
        ]
    },
    {
        "campo": "brand"
    },
    {
        "campo": "model"
    },
    {
        "campo": "year"
    },
    {
        "campo": "color",
		"tipo": "color"
    },
    {
        "campo": "motor"
    },
    {
        "titulo": "Serial number",
        "campo": "serial_number"
    },
    {
        "titulo": "Insurance number",
        "campo": "insurance_number"
    },
    {
        "titulo": "Fuel type",
        "campo": "fuel_type"
    },
    {
        "titulo": "Plate number",
        "campo": "plate_number"
    },
    {
        "campo": "capacity"
    },
    {
        "campo": "dimension"
    },
    {
        "campo": "comments",
        "tipo": "editor"
    }
]
 `,
                },
        ];

        await prisma.cMSMenu.createMany({
                data: cmsData,
        });
}

main()
        .catch((e) => {
                console.error(e);
                process.exit(1);
        })
        .finally(async () => {
                await prisma.$disconnect();
        });
